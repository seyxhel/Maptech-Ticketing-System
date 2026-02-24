from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    has_usable_password = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'middle_name', 'last_name', 'suffix', 'phone', 'last_login', 'is_agreed_privacy_policy', 'has_usable_password']

    def get_has_usable_password(self, obj):
        return obj.has_usable_password()


class RegisterSerializer(serializers.ModelSerializer):
    accept_terms = serializers.BooleanField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'middle_name', 'last_name', 'suffix', 'phone', 'accept_terms']
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, attrs):
        if not attrs.get('accept_terms'):
            raise serializers.ValidationError({'accept_terms': 'You must accept the terms.'})

        # required fields enforced server-side
        if not attrs.get('username'):
            raise serializers.ValidationError({'username': 'Username is required.'})
        if not attrs.get('password'):
            raise serializers.ValidationError({'password': 'Password is required.'})
        if not attrs.get('first_name'):
            raise serializers.ValidationError({'first_name': 'First name is required.'})
        if not attrs.get('last_name'):
            raise serializers.ValidationError({'last_name': 'Last name is required.'})

        return attrs

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with that username already exists.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with that email already exists.')
        return value

    def create(self, validated_data):
        validated_data.pop('accept_terms', None)
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            role=User.ROLE_CLIENT,
            is_agreed_privacy_policy=True,
            **{k: v for k, v in validated_data.items() if v is not None}
        )
        return user

class AdminUserCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    middle_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150)
    suffix = serializers.CharField(max_length=3, required=False, allow_blank=True)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=13, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=[('employee', 'Employee'), ('admin', 'Admin')])

    def validate_role(self, value):
        """Admin can only create employees; superadmin can create employees and admins."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if request.user.role == User.ROLE_ADMIN and value != 'employee':
                raise serializers.ValidationError('Admins can only create employee accounts.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with that email already exists.')
        return value

    def _generate_username(self, first_name, middle_name, last_name):
        import re
        sanitize = lambda s: re.sub(r'[^a-z0-9]', '', (s or '').lower())
        f = sanitize(first_name)
        m = sanitize(middle_name)
        l = sanitize(last_name)
        mid_initial = m[0] if m else ''
        base = f"{f}{mid_initial}{l}" if mid_initial else f"{f}{l}"
        if not base:
            base = 'user'
        username = base
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1
        return username

    @staticmethod
    def _format_phone(raw):
        """Convert 09XXXXXXXXX or 9XXXXXXXXX to +63XXXXXXXXXX."""
        import re
        digits = re.sub(r'\D', '', raw or '')
        if re.match(r'^0\d{10}$', digits):
            return '+63' + digits[1:]
        if re.match(r'^9\d{9}$', digits):
            return '+63' + digits
        if re.match(r'^63\d{10}$', digits):
            return '+' + digits
        return digits  # return as-is if pattern doesn't match

    def create(self, validated_data):
        username = self._generate_username(
            validated_data['first_name'],
            validated_data.get('middle_name', ''),
            validated_data['last_name'],
        )
        phone = self._format_phone(validated_data.get('phone', ''))
        role = validated_data['role']
        user = User.objects.create_user(
            username=username,
            password='password123',
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role=role,
            middle_name=validated_data.get('middle_name', ''),
            suffix=validated_data.get('suffix', ''),
            phone=phone,
            is_staff=role in (User.ROLE_ADMIN, User.ROLE_SUPERADMIN),
            is_superuser=role == User.ROLE_SUPERADMIN,
        )
        return user