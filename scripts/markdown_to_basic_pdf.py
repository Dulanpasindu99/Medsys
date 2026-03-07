from __future__ import annotations

import re
import sys
import textwrap
from pathlib import Path

PAGE_WIDTH = 595
PAGE_HEIGHT = 842
MARGIN_LEFT = 54
MARGIN_RIGHT = 54
MARGIN_TOP = 54
MARGIN_BOTTOM = 54
CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

FONT_REGULAR = "F1"
FONT_BOLD = "F2"


def escape_pdf_text(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
        .replace("\r", "")
    )


def wrap_text(text: str, font_size: int, available_width: int) -> list[str]:
    approx_char_width = max(font_size * 0.52, 1)
    width = max(int(available_width / approx_char_width), 20)
    return textwrap.wrap(text, width=width, break_long_words=False, break_on_hyphens=False) or [""]


def parse_markdown(markdown: str) -> list[dict[str, object]]:
    elements: list[dict[str, object]] = []
    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()

        if not stripped:
            elements.append({"kind": "blank"})
            continue

        if stripped.startswith("# "):
            elements.append({"kind": "heading1", "text": stripped[2:].strip()})
            continue

        if stripped.startswith("## "):
            elements.append({"kind": "heading2", "text": stripped[3:].strip()})
            continue

        if stripped.startswith("### "):
            elements.append({"kind": "heading3", "text": stripped[4:].strip()})
            continue

        if stripped.startswith("- "):
            elements.append({"kind": "bullet", "prefix": "- ", "text": stripped[2:].strip()})
            continue

        numbered = re.match(r"^(\d+\.\s+)(.+)$", stripped)
        if numbered:
            elements.append(
                {
                    "kind": "bullet",
                    "prefix": numbered.group(1),
                    "text": numbered.group(2).strip(),
                }
            )
            continue

        elements.append({"kind": "paragraph", "text": stripped})

    return elements


def render_pages(elements: list[dict[str, object]]) -> list[list[tuple[str, int, int, str, int]]]:
    pages: list[list[tuple[str, int, int, str, int]]] = [[]]
    y = PAGE_HEIGHT - MARGIN_TOP

    def ensure_space(height: int) -> None:
        nonlocal y
        if y - height < MARGIN_BOTTOM:
            pages.append([])
            y = PAGE_HEIGHT - MARGIN_TOP

    def add_blank(space: int) -> None:
        nonlocal y
        ensure_space(space)
        y -= space

    def add_text_line(text: str, font: str, size: int, indent: int = 0) -> None:
        nonlocal y
        line_height = size + 5
        ensure_space(line_height)
        y -= line_height
        pages[-1].append((text, MARGIN_LEFT + indent, y, font, size))

    for element in elements:
        kind = element["kind"]

        if kind == "blank":
            add_blank(8)
            continue

        if kind == "heading1":
            add_blank(6)
            for chunk in wrap_text(str(element["text"]), 22, CONTENT_WIDTH):
                add_text_line(chunk, FONT_BOLD, 22)
            add_blank(8)
            continue

        if kind == "heading2":
            add_blank(4)
            for chunk in wrap_text(str(element["text"]), 16, CONTENT_WIDTH):
                add_text_line(chunk, FONT_BOLD, 16)
            add_blank(4)
            continue

        if kind == "heading3":
            add_blank(2)
            for chunk in wrap_text(str(element["text"]), 13, CONTENT_WIDTH):
                add_text_line(chunk, FONT_BOLD, 13)
            add_blank(2)
            continue

        if kind == "bullet":
            prefix = str(element["prefix"])
            text = str(element["text"])
            indent = 14
            wrapped = wrap_text(text, 11, CONTENT_WIDTH - indent - 14)
            for index, chunk in enumerate(wrapped):
                label = prefix if index == 0 else " " * len(prefix)
                add_text_line(f"{label}{chunk}".rstrip(), FONT_REGULAR, 11, indent)
            add_blank(2)
            continue

        wrapped = wrap_text(str(element["text"]), 11, CONTENT_WIDTH)
        for chunk in wrapped:
            add_text_line(chunk, FONT_REGULAR, 11)
        add_blank(4)

    return [page for page in pages if page]


def build_pdf(page_commands: list[list[tuple[str, int, int, str, int]]]) -> bytes:
    objects: list[bytes] = []

    def add_object(data: bytes) -> int:
        objects.append(data)
        return len(objects)

    font_regular_obj = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    font_bold_obj = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

    content_obj_numbers: list[int] = []
    for page in page_commands:
        stream_lines = ["BT", "1 0 0 1 0 0 Tm"]
        for text, x, y, font, size in page:
            stream_lines.append(f"/{font} {size} Tf")
            stream_lines.append(f"1 0 0 1 {x} {y} Tm")
            stream_lines.append(f"({escape_pdf_text(text)}) Tj")
        stream_lines.append("ET")
        stream = "\n".join(stream_lines).encode("latin-1", "replace")
        content_obj_numbers.append(
            add_object(b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream")
        )

    page_object_numbers: list[int] = []
    pages_object_number = 3 + (len(content_obj_numbers) * 2)

    for content_obj_number in content_obj_numbers:
        page_data = (
            f"<< /Type /Page /Parent {pages_object_number} 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
            f"/Resources << /Font << /{FONT_REGULAR} {font_regular_obj} 0 R /{FONT_BOLD} {font_bold_obj} 0 R >> >> "
            f"/Contents {content_obj_number} 0 R >>"
        ).encode("ascii")
        page_object_numbers.append(add_object(page_data))

    kids = " ".join(f"{page_number} 0 R" for page_number in page_object_numbers)
    pages_obj = add_object(
        f"<< /Type /Pages /Count {len(page_object_numbers)} /Kids [{kids}] >>".encode("ascii")
    )
    catalog_obj = add_object(f"<< /Type /Catalog /Pages {pages_obj} 0 R >>".encode("ascii"))

    output = bytearray()
    output.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]

    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode("ascii"))
        output.extend(obj)
        output.extend(b"\nendobj\n")

    xref_offset = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    output.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_obj} 0 R >>\nstartxref\n{xref_offset}\n%%EOF".encode(
            "ascii"
        )
    )
    return bytes(output)


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python scripts/markdown_to_basic_pdf.py <input.md> <output.pdf>")
        return 1

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    markdown = input_path.read_text(encoding="utf-8")
    elements = parse_markdown(markdown)
    pages = render_pages(elements)
    pdf_bytes = build_pdf(pages)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(pdf_bytes)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
