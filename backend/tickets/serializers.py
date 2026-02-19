from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Ticket, TicketTask, Template


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'middle_name', 'last_name', 'suffix', 'phone', 'is_agree_conditions']


class RegisterSerializer(serializers.ModelSerializer):
    # accept_terms comes from the frontend; we'll store it on `is_agree_conditions` on the model.
    accept_terms = serializers.BooleanField(write_only=True, required=True)
    # also accept the alternate name if sent
    is_agree_conditions = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'middle_name', 'last_name', 'suffix', 'phone', 'accept_terms', 'is_agree_conditions']
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, attrs):
        # require agreement
        if not (attrs.get('accept_terms') or attrs.get('is_agree_conditions')):
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
        # preference: prefer explicit `is_agree_conditions` if provided
        accepted = validated_data.pop('is_agree_conditions', validated_data.pop('accept_terms', False))
        validated_data.pop('accept_terms', None)
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            role=User.ROLE_CLIENT,
            **{k: v for k, v in validated_data.items() if v is not None}
        )
        user.is_agree_conditions = bool(accepted)
        user.save()
        return user


class TicketTaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)

    class Meta:
        model = TicketTask
        fields = ['id', 'description', 'assigned_to', 'status', 'created_at']


class TicketSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    tasks = TicketTaskSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'title', 'description', 'status', 'created_by', 'assigned_to', 'tasks', 'created_at', 'updated_at']


class AdminUserCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    middle_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150)
    suffix = serializers.CharField(max_length=3, required=False, allow_blank=True)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=13, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=[('employee', 'Employee'), ('admin', 'Admin')])

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

    def create(self, validated_data):
        username = self._generate_username(
            validated_data['first_name'],
            validated_data.get('middle_name', ''),
            validated_data['last_name'],
        )
        user = User.objects.create_user(
            username=username,
            password='password123',
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role=validated_data['role'],
            middle_name=validated_data.get('middle_name', ''),
            suffix=validated_data.get('suffix', ''),
            phone=validated_data.get('phone', ''),
        )
        return user


class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ['id', 'name', 'steps']
