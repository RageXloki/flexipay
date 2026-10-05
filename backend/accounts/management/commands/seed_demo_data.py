import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User, Profile, LoginActivity, SecurityEvent
from wallets.models import Wallet, WalletTransaction
from payments.models import CardToken, BankAccount, UPIAccount, Transaction, PaymentRequest
from merchants.models import Merchant, PaymentLink, Refund
from notifications.models import Notification


class Command(BaseCommand):
    help = 'Seeds realistic sandbox demo data for PayFlow (User, Merchant, Admin, Transactions, Cards, UPI)'

    def handle(self, *args, **options):
        self.stdout.write("Seeding PayFlow sandbox demo data...")

        # 1. Clean existing test records if re-seeding
        Transaction.objects.all().delete()
        Notification.objects.all().delete()
        PaymentLink.objects.all().delete()
        Refund.objects.all().delete()
        PaymentRequest.objects.all().delete()
        CardToken.objects.all().delete()
        UPIAccount.objects.all().delete()
        BankAccount.objects.all().delete()
        WalletTransaction.objects.all().delete()
        Wallet.objects.all().delete()
        Profile.objects.all().delete()
        User.objects.all().delete()

        # 2. Create Demo User
        demo_user = User.objects.create_user(
            email='user@payflow.local',
            phone_number='+919876543210',
            full_name='Alex Morgan',
            password='DemoUser@123',
            role='USER',
            is_verified=True,
            two_factor_enabled=False
        )
        Profile.objects.create(
            user=demo_user,
            avatar_url='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
            bio='Product Designer & Fintech Enthusiast',
            city='Bengaluru',
            security_score=85
        )
        user_wallet = Wallet.objects.create(
            user=demo_user,
            balance=Decimal('24500.00'),
            currency='INR'
        )

        # 3. Create Demo Merchant
        demo_merchant = User.objects.create_user(
            email='merchant@payflow.local',
            phone_number='+919876543211',
            full_name='Elena Rostova',
            password='DemoMerchant@123',
            role='MERCHANT',
            is_verified=True,
            two_factor_enabled=True
        )
        Profile.objects.create(
            user=demo_merchant,
            avatar_url='https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
            bio='Founder at Apex Tech Gear',
            city='Mumbai',
            security_score=95
        )
        merchant_wallet = Wallet.objects.create(
            user=demo_merchant,
            balance=Decimal('142800.00'),
            currency='INR'
        )
        merchant_profile = Merchant.objects.create(
            user=demo_merchant,
            business_name='Apex Tech Gear',
            business_category='ECOMMERCE',
            business_id='BIZ-APEX-9921',
            website='https://apexgear.demo.local',
            is_verified=True
        )

        # 4. Create Demo Admin
        demo_admin = User.objects.create_superuser(
            email='admin@payflow.local',
            phone_number='+919876543212',
            full_name='Admin Supervisor',
            password='DemoAdmin@123',
            is_verified=True
        )
        Profile.objects.create(
            user=demo_admin,
            avatar_url='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
            bio='Chief Risk & Operations Officer',
            city='Bengaluru',
            security_score=100
        )
        admin_wallet = Wallet.objects.create(
            user=demo_admin,
            balance=Decimal('500000.00'),
            currency='INR'
        )

        # 5. Create Another User for P2P interactions
        peer_user = User.objects.create_user(
            email='priya@payflow.local',
            phone_number='+919876543219',
            full_name='Priya Sharma',
            password='PriyaUser@123',
            role='USER',
            is_verified=True
        )
        Profile.objects.create(user=peer_user, bio='Software Engineer', city='Hyderabad')
        peer_wallet = Wallet.objects.create(user=peer_user, balance=Decimal('12000.00'), currency='INR')

        # 6. UPI Accounts
        UPIAccount.objects.create(user=demo_user, upi_id='alex@payflow', is_primary=True)
        UPIAccount.objects.create(user=demo_merchant, upi_id='apexgear@payflow', is_primary=True)
        UPIAccount.objects.create(user=peer_user, upi_id='priya@payflow', is_primary=True)

        # 7. Tokenized Saved Cards (Strictly last4 & token, NO CVV!)
        CardToken.objects.create(
            user=demo_user,
            card_token='tok_sand_4242_alex',
            cardholder_name='Alex Morgan',
            card_brand='VISA',
            last_four_digits='4242',
            expiry_month=8,
            expiry_year=2028,
            is_default=True
        )
        CardToken.objects.create(
            user=demo_user,
            card_token='tok_sand_5555_alex',
            cardholder_name='Alex Morgan',
            card_brand='MASTERCARD',
            last_four_digits='5555',
            expiry_month=11,
            expiry_year=2027,
            is_default=False
        )

        # 8. Bank Accounts
        bank_user = BankAccount.objects.create(
            user=demo_user,
            account_holder_name='Alex Morgan',
            bank_name='HDFC Bank',
            masked_account_number='•••• •••• 8821',
            ifsc_code='HDFC0001234',
            account_type='SAVINGS',
            is_primary=True,
            is_verified=True
        )
        BankAccount.objects.create(
            user=demo_merchant,
            account_holder_name='Apex Tech Gear LLC',
            bank_name='ICICI Bank',
            masked_account_number='•••• •••• 4490',
            ifsc_code='ICIC0004490',
            account_type='CURRENT',
            is_primary=True,
            is_verified=True
        )

        # 9. Payment Links for Demo Merchant
        link1 = PaymentLink.objects.create(
            merchant=merchant_profile,
            link_code='apex-headphones',
            title='Apex Wave Pro Wireless Headphones',
            description='Active noise cancelling, 40h battery life, studio grade acoustic driver.',
            amount=Decimal('3499.00'),
            currency='INR',
            status='ACTIVE'
        )
        link2 = PaymentLink.objects.create(
            merchant=merchant_profile,
            link_code='apex-keyboard',
            title='Apex Keeb Pro Mechanical Keyboard',
            description='Hot-swappable switches, RGB backlit, aluminum chassis.',
            amount=Decimal('4999.00'),
            currency='INR',
            status='ACTIVE'
        )

        # 10. Sample Transactions
        now = timezone.now()

        # Txn 1: Wallet Topup
        t1 = Transaction.objects.create(
            transaction_id='TXN-2026-TOPUP01',
            sender=None,
            receiver=demo_user,
            amount=Decimal('15000.00'),
            currency='INR',
            payment_method='CARD',
            description='Wallet Top-Up via Visa **** 4242',
            status='SUCCESSFUL',
            reference_id='MOCK_ORD_TOPUP_882',
            created_at=now - datetime.timedelta(days=4),
            completed_at=now - datetime.timedelta(days=4)
        )
        user_wallet.ledger_transactions.create(
            transaction_type='CREDIT',
            amount=Decimal('15000.00'),
            balance_before=Decimal('9500.00'),
            balance_after=Decimal('24500.00'),
            reference_type='DEPOSIT',
            reference_id=t1.transaction_id,
            description='Wallet Top-Up via Card'
        )

        # Txn 2: P2P payment to Priya
        t2 = Transaction.objects.create(
            transaction_id='TXN-2026-P2P9821',
            sender=demo_user,
            receiver=peer_user,
            amount=Decimal('1200.00'),
            currency='INR',
            payment_method='WALLET',
            description='Dinner split & beverages',
            status='SUCCESSFUL',
            reference_id='WAL_XFER_P2P9821',
            created_at=now - datetime.timedelta(days=3),
            completed_at=now - datetime.timedelta(days=3)
        )

        # Txn 3: Merchant Purchase at Apex Tech Gear
        t3 = Transaction.objects.create(
            transaction_id='TXN-2026-MRCH441',
            sender=demo_user,
            receiver=demo_merchant,
            amount=Decimal('3499.00'),
            currency='INR',
            payment_method='UPI',
            description='Apex Wave Pro Wireless Headphones',
            status='SUCCESSFUL',
            reference_id='PAY_APEX_HEADPHONES_01',
            created_at=now - datetime.timedelta(days=2),
            completed_at=now - datetime.timedelta(days=2)
        )

        # Txn 4: Refunded transaction
        t4 = Transaction.objects.create(
            transaction_id='TXN-2026-RFND001',
            sender=demo_user,
            receiver=demo_merchant,
            amount=Decimal('850.00'),
            currency='INR',
            payment_method='WALLET',
            description='Apex Cable Accessory (Returned)',
            status='REFUNDED',
            reference_id='ORD_RET_850',
            created_at=now - datetime.timedelta(days=5),
            completed_at=now - datetime.timedelta(days=5)
        )
        Refund.objects.create(
            transaction=t4,
            merchant=merchant_profile,
            amount=Decimal('850.00'),
            refund_type='FULL',
            reason='Customer cancelled order before shipping',
            status='COMPLETED',
            refund_reference='REF-2026-APEX850'
        )

        # Txn 5: Educational Fraud Detection Simulation Example
        t5 = Transaction.objects.create(
            transaction_id='TXN-2026-FRD9921',
            sender=demo_user,
            receiver=demo_merchant,
            amount=Decimal('75000.00'),
            currency='INR',
            payment_method='CARD',
            description='High Value Wholesale Hardware Order',
            status='SUCCESSFUL',
            is_flagged_fraud=True,
            fraud_reason='High-value transaction warning: Amount ₹75,000 exceeds standard single-transaction threshold of ₹50,000.',
            reference_id='MOCK_ORD_FLAGGED_75K',
            created_at=now - datetime.timedelta(hours=18),
            completed_at=now - datetime.timedelta(hours=18)
        )

        # 11. Payment Request
        PaymentRequest.objects.create(
            requester=peer_user,
            payer=demo_user,
            amount=Decimal('450.00'),
            note='Coffee and co-working pass',
            status='PENDING',
            expires_at=now + datetime.timedelta(days=2)
        )

        # 12. Security Events and Login Activity
        LoginActivity.objects.create(
            user=demo_user,
            ip_address='127.0.0.1',
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
            device_name='Chrome (Windows 11)',
            status='SUCCESS'
        )
        SecurityEvent.objects.create(
            user=demo_user,
            event_type='LOGIN',
            description='Successful login from Chrome (Windows 11)',
            ip_address='127.0.0.1'
        )
        SecurityEvent.objects.create(
            user=demo_user,
            event_type='CARD_ADDED',
            description='Tokenized Visa card ending in 4242 added',
            ip_address='127.0.0.1'
        )

        # 13. Notifications
        Notification.objects.create(
            user=demo_user,
            title='Payment Received',
            message='₹15,000 added to your PayFlow wallet via test card.',
            notification_type='PAYMENT_RECEIVED',
            reference_id=t1.transaction_id,
            is_read=True
        )
        Notification.objects.create(
            user=demo_user,
            title='Payment Request Received',
            message='Priya Sharma requested ₹450 for Coffee and co-working pass.',
            notification_type='PAYMENT_REQUEST',
            is_read=False
        )
        Notification.objects.create(
            user=demo_user,
            title='Security Alert (Demo Simulation)',
            message='Transaction TXN-2026-FRD9921 for ₹75,000 triggered risk threshold verification.',
            notification_type='SECURITY_ALERT',
            reference_id=t5.transaction_id,
            is_read=False
        )

        self.stdout.write(self.style.SUCCESS("PayFlow sandbox demo data seeded successfully!"))
        self.stdout.write("Demo accounts created:")
        self.stdout.write("  User:     user@payflow.local     / DemoUser@123")
        self.stdout.write("  Merchant: merchant@payflow.local / DemoMerchant@123")
        self.stdout.write("  Admin:    admin@payflow.local    / DemoAdmin@123")
