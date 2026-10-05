from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, Profile
from wallets.models import Wallet
from payments.models import CardToken, UPIAccount, Transaction
from payments.fraud_detector import FraudDetector


class PayFlowCoreTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='alice@payflow.local',
            phone_number='+919999911111',
            full_name='Alice Smith',
            password='TestPassword@123',
            role='USER'
        )
        self.profile = Profile.objects.create(user=self.user)
        self.wallet = Wallet.objects.create(user=self.user, balance=Decimal('5000.00'), currency='INR')
        self.upi = UPIAccount.objects.create(user=self.user, upi_id='alice@payflow', is_primary=True)

        self.bob = User.objects.create_user(
            email='bob@payflow.local',
            phone_number='+919999922222',
            full_name='Bob Jones',
            password='TestPassword@123',
            role='USER'
        )
        self.bob_wallet = Wallet.objects.create(user=self.bob, balance=Decimal('1000.00'), currency='INR')
        self.bob_upi = UPIAccount.objects.create(user=self.bob, upi_id='bob@payflow', is_primary=True)

    def test_login_and_jwt_generation(self):
        resp = self.client.post('/api/auth/login/', {
            'identifier': 'alice@payflow.local',
            'password': 'TestPassword@123'
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', resp.data)
        self.assertIn('access', resp.data['tokens'])

    def test_card_tokenization_security_pci_compliance(self):
        """Ensure full PAN and CVV are never stored in the database."""
        self.client.force_authenticate(user=self.user)
        resp = self.client.post('/api/payments/cards/', {
            'cardholder_name': 'Alice Smith',
            'card_number': '4111 1111 1111 4242',
            'expiry_month': 12,
            'expiry_year': 2028,
            'cvv': '123',
            'is_default': True
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        card = CardToken.objects.get(user=self.user, last_four_digits='4242')
        self.assertEqual(card.last_four_digits, '4242')
        self.assertEqual(card.card_brand, 'VISA')
        self.assertTrue(card.card_token.startswith('tok_sand_'))

        # Check DB columns directly to verify no CVV or raw PAN exists
        card_fields = [f.name for f in CardToken._meta.get_fields()]
        self.assertNotIn('cvv', card_fields)
        self.assertNotIn('card_number', card_fields)

    def test_wallet_send_money_atomic_transfer(self):
        self.client.force_authenticate(user=self.user)
        transfer_amount = Decimal('1500.00')

        resp = self.client.post('/api/payments/send/', {
            'recipient': 'bob@payflow',
            'amount': str(transfer_amount),
            'payment_method': 'WALLET',
            'note': 'Test dinner transfer'
        })

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.wallet.refresh_from_db()
        self.bob.wallet.refresh_from_db()

        self.assertEqual(self.user.wallet.balance, Decimal('3500.00'))
        self.assertEqual(self.bob.wallet.balance, Decimal('2500.00'))

    def test_idempotency_prevents_duplicate_charge(self):
        self.client.force_authenticate(user=self.user)
        idempotency_key = 'idem-unique-key-12345'
        payload = {
            'recipient': 'bob@payflow.local',
            'amount': '200.00',
            'payment_method': 'WALLET',
            'note': 'Idempotent test'
        }

        # First request
        resp1 = self.client.post('/api/payments/send/', payload, HTTP_IDEMPOTENCY_KEY=idempotency_key)
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        # Second request with identical idempotency key
        resp2 = self.client.post('/api/payments/send/', payload, HTTP_IDEMPOTENCY_KEY=idempotency_key)
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)

        # Confirm only ONE transaction was created with this idempotency key
        txns = Transaction.objects.filter(idempotency_key=idempotency_key)
        self.assertEqual(txns.count(), 1)

    def test_fraud_detector_flag_for_high_amount(self):
        is_flagged, reason = FraudDetector.evaluate_payment(self.user, Decimal('60000.00'))
        self.assertTrue(is_flagged)
        self.assertIn('High-value transaction warning', reason)
