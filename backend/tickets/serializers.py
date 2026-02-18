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


class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ['id', 'name', 'steps']
