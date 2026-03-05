from django.core.management.base import BaseCommand
from tickets.models import Category


CATEGORIES = [
    {
        "name": "Cyber Security",
        "description": "Solutions and tools designed to protect networks, systems, and data from unauthorized access, cyber threats, and digital attacks.",
    },
    {
        "name": "Wireless Access Points & Switches",
        "description": "Networking hardware that enables wireless connectivity and manages data traffic between devices within a local area network.",
    },
    {
        "name": "Closed-Circuit Television (CCTV)",
        "description": "Surveillance systems using cameras and monitors for security monitoring, recording, and real-time observation of premises.",
    },
    {
        "name": "Computer | Desktop | Laptop | Monitor",
        "description": "Personal computing devices and display units used for business, education, and general productivity.",
    },
    {
        "name": "Fiber Optic, Structured Cabling & Rehabilitation",
        "description": "Infrastructure solutions for high-speed data transmission, organized cabling systems, and repair or upgrade of existing network lines.",
    },
    {
        "name": "Telephony Solution",
        "description": "Communication systems including VoIP, PBX, and traditional telephony setups for voice and call management.",
    },
    {
        "name": "Door Access",
        "description": "Electronic and mechanical systems that regulate entry to secured areas, including card readers and smart locks.",
    },
    {
        "name": "Biometrics",
        "description": "Authentication devices and systems that use fingerprint, facial recognition, or other biometric identifiers for secure access.",
    },
    {
        "name": "Uninterruptible Power Supply (UPS)",
        "description": "Backup power devices that provide continuous electricity to critical systems during outages or fluctuations.",
    },
    {
        "name": "Storage and Servers",
        "description": "Hardware and solutions for data storage, processing, and centralized management of applications and resources.",
    },
    {
        "name": "SD-WAN",
        "description": "Software-defined networking solutions that optimize wide-area network performance, security, and cost efficiency.",
    },
    {
        "name": "Printing Devices & Consumables",
        "description": "Printers, multifunction devices, and related supplies such as ink, toner, and paper for office and business use.",
    },
    {
        "name": "I.T. Peripherals",
        "description": "Accessories and external devices that enhance computing functionality, including keyboards, mice, external drives, and adapters.",
    },
    {
        "name": "Video Conferencing",
        "description": "Platforms and hardware enabling real-time audio-visual communication and collaboration across remote locations.",
    },
]


class Command(BaseCommand):
    help = "Seed the Category table with default product categories."

    def handle(self, *args, **options):
        created_count = 0
        for cat in CATEGORIES:
            _, created = Category.objects.get_or_create(
                name=cat["name"],
                defaults={"description": cat["description"]},
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  Created: {cat["name"]}'))
            else:
                self.stdout.write(f'  Already exists: {cat["name"]}')

        self.stdout.write(self.style.SUCCESS(f"\nDone. {created_count} new categories created."))
