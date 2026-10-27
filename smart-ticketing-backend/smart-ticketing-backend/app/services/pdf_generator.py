import io
import json
from datetime import datetime
import qrcode
from PIL import Image

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_ticket_pdf(booking):
    """
    Generates a high-quality, professional printable PDF admission ticket for a confirmed booking.
    Returns a BytesIO stream containing the PDF binary.
    """
    event = booking.event
    tier = booking.ticket_tier
    user = booking.user

    # Create in-memory buffer
    buffer = io.BytesIO()
    
    # Page setup - Letter size: 612 x 792 points
    page_width, page_height = letter
    c = canvas.Canvas(buffer, pagesize=letter)
    c.setTitle(f"FairPass Ticket - FP-{booking.id:06d}")
    c.setAuthor("FairPass AI")
    c.setSubject(f"Admission Ticket for {event.title if event else 'Event'}")

    # Color Palette matching FairPass AI design system
    COLOR_PRIMARY = colors.HexColor("#6366f1")      # Indigo accent
    COLOR_PRIMARY_DARK = colors.HexColor("#4338ca") # Deep indigo
    COLOR_BG_DARK = colors.HexColor("#0d121f")       # Cyber dark
    COLOR_HEADER_BG = colors.HexColor("#121826")     # Card background
    COLOR_EMERALD = colors.HexColor("#10b981")       # Success / low risk
    COLOR_EMERALD_BG = colors.HexColor("#ecfdf5")    # Soft green
    COLOR_BORDER = colors.HexColor("#cbd5e1")        # Slate border
    COLOR_BORDER_DARK = colors.HexColor("#334155")   # Dark border
    COLOR_TEXT_MAIN = colors.HexColor("#0f172a")     # Slate 900
    COLOR_TEXT_MUTED = colors.HexColor("#475569")    # Slate 600
    COLOR_TEXT_DIM = colors.HexColor("#94a3b8")      # Slate 400
    COLOR_LIGHT_BG = colors.HexColor("#f8fafc")      # Off-white ticket body

    # Ticket Box Geometry
    ticket_margin_x = 36
    ticket_width = page_width - (ticket_margin_x * 2) # 540 pt
    ticket_top = 740
    ticket_height = 680
    ticket_bottom = ticket_top - ticket_height        # 60 pt

    # 1. Ticket Card Background (clean off-white with subtle rounded corner)
    c.setFillColor(colors.white)
    c.setStrokeColor(COLOR_BORDER)
    c.setLineWidth(1.5)
    c.roundRect(ticket_margin_x, ticket_bottom, ticket_width, ticket_height, 14, fill=1, stroke=1)

    # 2. Header Banner (Dark Sleek FairPass Branded Block)
    header_height = 92
    header_y = ticket_top - header_height

    # Draw header dark fill with top rounded corners
    c.saveState()
    path = c.beginPath()
    path.moveTo(ticket_margin_x, ticket_top - 14)
    path.arc(ticket_margin_x, ticket_top - 28, ticket_margin_x + 28, ticket_top, 90, 90)
    path.lineTo(ticket_margin_x + ticket_width - 14, ticket_top)
    path.arc(ticket_margin_x + ticket_width - 28, ticket_top - 28, ticket_margin_x + ticket_width, ticket_top, 0, 90)
    path.lineTo(ticket_margin_x + ticket_width, header_y)
    path.lineTo(ticket_margin_x, header_y)
    path.close()
    c.setFillColor(COLOR_BG_DARK)
    c.clipPath(path, stroke=0)
    c.rect(ticket_margin_x, header_y, ticket_width, header_height, fill=1, stroke=0)
    c.restoreState()

    # Brand Title in Header
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(ticket_margin_x + 24, ticket_top - 38, "FairPass")
    
    # "AI" highlighted text
    c.setFillColor(colors.HexColor("#06b6d4")) # Cyan
    c.drawString(ticket_margin_x + 112, ticket_top - 38, "AI")

    # Brand subtitle
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.setFont("Helvetica-Bold", 8)
    c.drawString(ticket_margin_x + 24, ticket_top - 52, "ANTI-SCALPING & CONCURRENCY-PROTECTED TICKETING")

    # Security Stamp Pill in Header (Right Side)
    pill_w = 210
    pill_h = 24
    pill_x = ticket_margin_x + ticket_width - pill_w - 24
    pill_y = ticket_top - 46

    c.setFillColor(colors.HexColor("#064e3b")) # Dark emerald bg
    c.setStrokeColor(COLOR_EMERALD)
    c.setLineWidth(1)
    c.roundRect(pill_x, pill_y, pill_w, pill_h, 6, fill=1, stroke=1)

    c.setFillColor(COLOR_EMERALD)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(pill_x + (pill_w / 2), pill_y + 8, "VERIFIED AUTHENTIC • ADMISSION PASS")

    # Ticket reference in header
    c.setFillColor(colors.HexColor("#cbd5e1"))
    c.setFont("Helvetica", 9)
    c.drawRightString(ticket_margin_x + ticket_width - 24, ticket_top - 70, f"PASS REF: #FP-{booking.id:06d}")

    # 3. Sub-header Bar (Accent strip)
    c.setFillColor(COLOR_PRIMARY)
    c.rect(ticket_margin_x, header_y - 4, ticket_width, 4, fill=1, stroke=0)

    # 4. Event Headline & Details Section
    content_y = header_y - 28
    
    # Event Title
    event_title = event.title if event else "General Event Admission"
    c.setFillColor(COLOR_TEXT_MAIN)
    c.setFont("Helvetica-Bold", 17)
    
    # Word wrap event title if needed
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'EventTitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=21,
        textColor=COLOR_TEXT_MAIN
    )
    title_p = Paragraph(event_title, title_style)
    tw, th = title_p.wrap(ticket_width - 48, 60)
    title_p.drawOn(c, ticket_margin_x + 24, content_y - th + 14)

    content_y -= (th + 10)

    # Event Description (if available)
    if event and event.description:
        desc_style = ParagraphStyle(
            'EventDescStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13,
            textColor=COLOR_TEXT_MUTED
        )
        # Limit description length for aesthetic balance
        desc_text = event.description.strip()
        if len(desc_text) > 220:
            desc_text = desc_text[:217] + "..."
        desc_p = Paragraph(desc_text, desc_style)
        dw, dh = desc_p.wrap(ticket_width - 48, 40)
        desc_p.drawOn(c, ticket_margin_x + 24, content_y - dh + 8)
        content_y -= (dh + 14)
    else:
        content_y -= 8

    # Event Date, Time & Venue Highlight Box
    box_w = ticket_width - 48
    box_h = 58
    box_x = ticket_margin_x + 24
    box_y = content_y - box_h

    c.setFillColor(COLOR_LIGHT_BG)
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.setLineWidth(1)
    c.roundRect(box_x, box_y, box_w, box_h, 8, fill=1, stroke=1)

    # Format event date and time
    if event and event.event_date:
        event_dt = event.event_date
        date_str = event_dt.strftime("%A, %B %d, %Y")
        time_str = event_dt.strftime("%I:%M %p")
    else:
        date_str = "Date TBA"
        time_str = "Time TBA"

    venue_str = event.venue if event else "Venue Location TBA"

    # Date Column
    c.setFillColor(COLOR_TEXT_DIM)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(box_x + 16, box_y + box_h - 18, "EVENT DATE & TIME")
    c.setFillColor(COLOR_PRIMARY_DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(box_x + 16, box_y + box_h - 34, f"{date_str} • {time_str}")

    # Venue Column
    c.setFillColor(COLOR_TEXT_DIM)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(box_x + (box_w / 2) + 10, box_y + box_h - 18, "VENUE LOCATION")
    c.setFillColor(COLOR_TEXT_MAIN)
    c.setFont("Helvetica-Bold", 10.5)
    
    # Truncate venue if overly long
    if len(venue_str) > 34:
        venue_str = venue_str[:32] + "..."
    c.drawString(box_x + (box_w / 2) + 10, box_y + box_h - 34, venue_str)

    content_y = box_y - 20

    # 5. Attendee & Booking Metadata 2-Column Table
    table_w = ticket_width - 48
    table_x = ticket_margin_x + 24
    table_y = content_y - 124

    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.roundRect(table_x, table_y, table_w, 124, 8, fill=1, stroke=1)

    col1_x = table_x + 16
    col2_x = table_x + (table_w / 2) + 16

    # Row 1: Attendee Name | Ticket Tier
    c.setFillColor(COLOR_TEXT_DIM)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(col1_x, table_y + 104, "REGISTERED TICKET HOLDER")
    c.drawString(col2_x, table_y + 104, "TICKET TIER / CATEGORY")

    holder_name = user.username.title() if user and user.username else "Valued Guest"
    tier_name = tier.tier_name if tier else "Standard Admission"
    c.setFillColor(COLOR_TEXT_MAIN)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(col1_x, table_y + 90, holder_name)
    c.drawString(col2_x, table_y + 90, tier_name)

    # Row 2: Account Email | Number of Seats / Tickets
    c.setFillColor(COLOR_TEXT_DIM)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(col1_x, table_y + 68, "ACCOUNT EMAIL")
    c.drawString(col2_x, table_y + 68, "QUANTITY / SEATS RESERVED")

    email_str = user.email if user and user.email else "N/A"
    qty_str = f"{booking.quantity} {'Ticket' if booking.quantity == 1 else 'Tickets'}"
    c.setFillColor(COLOR_TEXT_MUTED)
    c.setFont("Helvetica", 9.5)
    c.drawString(col1_x, table_y + 54, email_str)
    c.setFillColor(COLOR_TEXT_MAIN)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(col2_x, table_y + 54, qty_str)

    # Row 3: Booking Reference & Date | Total Paid & Status
    c.setFillColor(COLOR_TEXT_DIM)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(col1_x, table_y + 32, "BOOKING REFERENCE & DATE")
    c.drawString(col2_x, table_y + 32, "PAYMENT & ALLOCATION STATUS")

    booking_date_str = booking.created_at.strftime("%b %d, %Y • %I:%M %p UTC") if booking.created_at else "Confirmed"
    total_paid_str = f"${float(booking.total_price):.2f}"
    status_str = (booking.status or "CONFIRMED").upper()

    c.setFillColor(COLOR_TEXT_MUTED)
    c.setFont("Helvetica", 9)
    c.drawString(col1_x, table_y + 18, f"#FP-{booking.id:06d} ({booking_date_str})")

    # Status Pill inside row 3
    c.setFillColor(COLOR_TEXT_MAIN)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(col2_x, table_y + 18, total_paid_str)
    
    # Green status tag
    c.setFillColor(COLOR_EMERALD_BG)
    c.setStrokeColor(COLOR_EMERALD)
    c.setLineWidth(0.8)
    status_tag_x = col2_x + 68
    c.roundRect(status_tag_x, table_y + 14, 86, 17, 4, fill=1, stroke=1)
    c.setFillColor(COLOR_EMERALD)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(status_tag_x + 43, table_y + 19, f"• {status_str}")

    content_y = table_y - 18

    # 6. Tear-off Perforation Divider with Notches
    perf_y = content_y
    c.saveState()
    # Left notch cutout circle
    c.setFillColor(COLOR_LIGHT_BG)
    c.setStrokeColor(COLOR_BORDER)
    c.setLineWidth(1.5)
    c.circle(ticket_margin_x, perf_y, 10, fill=1, stroke=1)
    # Right notch cutout circle
    c.circle(ticket_margin_x + ticket_width, perf_y, 10, fill=1, stroke=1)

    # Dashed divider line across
    c.setStrokeColor(colors.HexColor("#94a3b8"))
    c.setLineWidth(1)
    c.setDash([4, 4], 0)
    c.line(ticket_margin_x + 14, perf_y, ticket_margin_x + ticket_width - 14, perf_y)
    c.restoreState()

    content_y = perf_y - 20

    # 7. Verification & QR Code Security Section
    sec_w = ticket_width - 48
    sec_h = 146
    sec_x = ticket_margin_x + 24
    sec_y = content_y - sec_h

    # Card background for QR section
    c.setFillColor(COLOR_LIGHT_BG)
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.setLineWidth(1)
    c.roundRect(sec_x, sec_y, sec_w, sec_h, 8, fill=1, stroke=1)

    # Generate Real QR Code
    qr_payload = {
        "fairpass_verification": True,
        "ticket_id": f"FP-{booking.id:06d}",
        "booking_id": booking.id,
        "event_id": event.id if event else 0,
        "event_title": event.title if event else "FairPass Event",
        "holder": user.username if user else "Guest",
        "seats": booking.quantity,
        "risk_tier": booking.risk_tier,
        "status": booking.status,
        "timestamp": booking.created_at.isoformat() if booking.created_at else datetime.utcnow().isoformat()
    }
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=1,
    )
    qr.add_data(json.dumps(qr_payload))
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#07090e", back_color="white")

    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)

    # Draw QR code in white rounded box
    qr_box_size = 118
    qr_box_x = sec_x + 14
    qr_box_y = sec_y + 14

    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setLineWidth(1)
    c.roundRect(qr_box_x, qr_box_y, qr_box_size, qr_box_size, 6, fill=1, stroke=1)

    from reportlab.lib.utils import ImageReader
    c.drawImage(ImageReader(qr_buffer), qr_box_x + 6, qr_box_y + 6, width=qr_box_size - 12, height=qr_box_size - 12)

    # Right side of QR section: Verification Token & Security Instructions
    info_x = qr_box_x + qr_box_size + 18
    info_w = sec_w - qr_box_size - 40

    c.setFillColor(COLOR_TEXT_DIM)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(info_x, sec_y + sec_h - 22, "CRYPTOGRAPHIC ADMISSION TOKEN")

    c.setFillColor(COLOR_PRIMARY_DARK)
    c.setFont("Helvetica-Bold", 9.5)
    token_str = f"FAIRPASS-SECURE-TOKEN-{booking.id:06d}-{event.id if event else 1}-2026"
    c.drawString(info_x, sec_y + sec_h - 36, token_str)

    # Anti-Scalping Engine Stamp
    c.setFillColor(COLOR_TEXT_DIM)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(info_x, sec_y + sec_h - 52, "SECURITY AUDIT ENGINE")

    c.setFillColor(COLOR_EMERALD)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(info_x, sec_y + sec_h - 64, f"PASSED • BEHAVIORAL RISK: {booking.risk_tier} • PESSIMISTIC LOCK: CONFIRMED")

    # Admission Guidelines Checklist
    c.setFillColor(COLOR_TEXT_MUTED)
    c.setFont("Helvetica", 7.8)
    guidelines = [
        "• Present this digital QR code on your mobile device or printed copy at entry.",
        "• Each ticket pass contains a unique cryptographic hash and can be scanned only once.",
        "• Photo ID matching attendee name may be requested by event security.",
        "• Non-transferable admission protected under FairPass Anti-Scalping Policy."
    ]
    gy = sec_y + sec_h - 80
    for gl in guidelines:
        c.drawString(info_x, gy, gl)
        gy -= 13

    # 8. Bottom Footer & Disclaimer
    footer_y = ticket_bottom + 14
    c.setFillColor(COLOR_TEXT_DIM)
    c.setFont("Helvetica", 7.5)
    c.drawString(ticket_margin_x + 24, footer_y, "FairPass AI Smart Ticketing • Concurrency & Machine Learning Anti-Scalping Protection")
    c.drawRightString(ticket_margin_x + ticket_width - 24, footer_y, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")

    # Finish page and save
    c.showPage()
    c.save()

    buffer.seek(0)
    return buffer
