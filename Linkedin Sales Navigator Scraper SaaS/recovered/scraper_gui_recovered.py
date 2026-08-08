"""
RECOVERED SOURCE — scraper_gui.py :: LinkedInScraperGUI.scrape_data()

Origin:      NEW_LinkedIn_Lead_Scraper.exe (PyInstaller, CPython 3.11, Windows x86-64)
Recovered:   from the unmarshalled code object + bytecode disassembly.
Original:    scraper_gui.py, class LinkedInScraperGUI, scrape_data() at lines 159-309.

FIDELITY NOTE
-------------
This is a reconstruction from authoritative CPython 3.11 bytecode, not a guess.
Every selector, regex, attribute name, literal string, control-flow branch and
output column below was read directly from the compiled instructions.

What is exact: selectors, regexes, attribute names, output column names and
order, branch structure, fallback chains, the =HYPERLINK() formula construction.

What is inferred: local formatting, f-string vs concat style, and comments.
None of that affects behaviour.

The GUI methods (__init__ L11, create_widgets L25, log_message L143,
browse_html_file L150, save_to_excel L310, copy_to_clipboard L400) are
deliberately NOT reconstructed here — they are Tkinter/pandas desktop concerns
that the SaaS discards. Only the extraction logic is portable.

DO NOT ADD THIS TO THE RUNTIME. It is reference material for the Phase 1 audit.
"""

import os
import re

import pandas as pd
from bs4 import BeautifulSoup
from tkinter import messagebox


def scrape_data(self):
    html_file = self.html_file_path.get()

    if not html_file:
        messagebox.showerror("Error", "Please select an HTML file first!")
        return None

    if not os.path.exists(html_file):
        messagebox.showerror("Error", "Selected HTML file does not exist!")
        return None

    self.log_message("Starting scraper...")
    self.log_message(f"Reading: {os.path.basename(html_file)}")

    try:
        # DEFECT: encoding is hardcoded. A page saved as UTF-16 or cp1252
        # raises UnicodeDecodeError and kills the whole run (caught at L305).
        with open(html_file, "r", encoding="utf-8") as file:
            html_content = file.read()

        # DEFECT: 'html.parser' is used even though lxml is bundled.
        # Slower, and more fragile on malformed markup.
        soup = BeautifulSoup(html_content, "html.parser")

        # L181 — the row anchor for every lead.
        lead_rows = soup.find_all("tr", {"data-x--people-list--row": True})

        if not lead_rows:
            messagebox.showerror("Error", "No leads found in the HTML file!")
            self.log_message("ERROR: No leads found!")
            return None

        self.log_message(f"Found {len(lead_rows)} leads")

        leads_data = []

        # L193-205 — first pass: build company_id -> location from hovercards.
        # Company location lives outside the row, in a tooltip element.
        company_locations = {}
        hover_cards = soup.find_all(
            "div",
            id=re.compile(r"hue-web-tooltip-content-company-hovercard-\d+-\d+"),
        )

        for hover_card in hover_cards:
            hover_card_id = hover_card.get("id", "")
            match = re.search(r"company-hovercard-(\d+)-", hover_card_id)
            if match:
                company_id = match.group(1)
                location_li = hover_card.find(
                    "li", **{"data-anonymize": "location", "aria-hidden": "true"}
                )
                if location_li:
                    location_text = location_li.get_text(strip=True)
                    company_locations[company_id] = location_text

        # L208 — second pass: one lead per row.
        for idx, row in enumerate(lead_rows, 1):
            try:
                # --- Name + profile URL (L211-233) -------------------------
                img_link = row.find("a", class_=re.compile(r".*view-profile-image-link.*"))
                name = ""
                profile_url = ""

                if img_link:
                    a11y_span = img_link.find("span", class_="a11y-text")
                    if a11y_span:
                        name = a11y_span.get_text(strip=True)
                    profile_url = img_link.get("href", "")

                # Fallback when the avatar link is absent.
                if not name:
                    name_link = row.find("a", {"data-x--people-list--person-name": ""})
                    if name_link:
                        name_span = name_link.find(
                            "span", class_=re.compile(r".*lead-detail-entity-details.*")
                        )
                        if name_span:
                            name = name_span.get_text(strip=True)
                        if not profile_url:
                            profile_url = name_link.get("href", "")

                # CONFLICT: name and URL are fused into a spreadsheet formula.
                # The SaaS needs them as separate columns for dedupe (spec 12.1).
                if name and profile_url:
                    name_with_link = f'=HYPERLINK("{profile_url}", "{name}")'
                else:
                    name_with_link = name

                # --- Designation (L236-237) --------------------------------
                designation_div = row.find("div", {"data-anonymize": "job-title"})
                designation = designation_div.get_text(strip=True) if designation_div else ""

                # --- Company (L240-257) ------------------------------------
                company_link = row.find("a", href=re.compile(r"/sales/company/\d+"))
                company_name = ""
                company_url = ""
                company_with_link = ""

                if company_link:
                    company_url = company_link.get("href", "")
                    company_name_span = company_link.find(
                        "span", {"data-anonymize": "company-name"}
                    )
                    if company_name_span:
                        company_name = company_name_span.get_text(strip=True)

                    if company_name and company_url:
                        if company_url.startswith("/"):
                            company_url = "https://www.linkedin.com" + company_url
                        company_with_link = f'=HYPERLINK("{company_url}", "{company_name}")'
                    else:
                        company_with_link = company_name

                # --- Geography (L260-272) ----------------------------------
                # Prefer the hovercard location, fall back to the row cell.
                geography = ""
                if company_link:
                    company_href = company_link.get("href", "")
                    company_id_match = re.search(r"/sales/company/(\d+)", company_href)
                    if company_id_match:
                        company_id = company_id_match.group(1)
                        geography = company_locations.get(company_id, "")

                if not geography:
                    geography_cell = row.find("td", class_=re.compile(r".*geography.*"))
                    if geography_cell:
                        geography = geography_cell.get_text(strip=True)

                # --- Notes (L275-279) --------------------------------------
                notes_div = row.find("div", class_="list-entity-notes__preview-text")
                notes = ""
                if notes_div:
                    note_spans = notes_div.find_all(
                        "span", style=lambda value: value and "display: inline" in value
                    )
                    notes = " ".join([span.get_text(strip=True) for span in note_spans])

                # --- Date added (L282-283) ---------------------------------
                date_cell = row.find("td", class_=re.compile(r".*date-added.*"))
                date_added = date_cell.get_text(strip=True) if date_cell else ""

                # L285-291 — output column names and order, verbatim.
                leads_data.append(
                    {
                        "Name": name_with_link,
                        "Designation": designation,
                        "Company": company_with_link,
                        "Geography": geography,
                        "Notes": notes,
                        "Date Entered": date_added,
                    }
                )

                if idx % 5 == 0:
                    self.log_message(f"Processing... {idx}/{len(lead_rows)}")

            except Exception as e:
                # Per-row isolation: one bad row does not kill the batch.
                # This behaviour maps onto the spec's per-file isolation (11.2).
                self.log_message(f"Error processing row {idx}: {str(e)}")
                continue

        df = pd.DataFrame(leads_data)
        self.log_message(f"Successfully extracted {len(df)} leads")
        return df

    except Exception as e:
        messagebox.showerror("Error", f"Failed to parse HTML file:\n{str(e)}")
        self.log_message(f"ERROR: {str(e)}")
        return None
