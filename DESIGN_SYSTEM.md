# NVC Dancefloor - Design System & UI/UX Guidelines 2026

## 1. Filozofia Projektowa

Aplikacja służy do nawigacji po emocjach i potrzebach. System łączy klasyczną dydaktykę NVC z kojącą, nowoczesną estetyką, wspierając proces introspekcji poprzez psychologię kolorów.

---

## 2. Paleta Kolorów (Zgodna z metodą NVC)

Zastosowano mapowanie klasycznych kolorów NVC na nowoczesne, pastelowe odcienie 2026, aby zachować czytelność procesu przy jednoczesnym obniżeniu napięcia wizualnego.

### Strefy Procesu (Kodowanie Kolorystyczne)

- **Intencja / Połączenie:** `#D8B4FE` (Soft Lavender/Muted Violet). Odcień fioletu, który symbolizuje wyższą perspektywę, autentyczny kontakt i gotowość do empatii.
- **Obserwacje (Fakty):** `#E6E6FA`
- **Uczucia (Emocje):** `#FFB5A7`
- **Potrzeby (Wartości):** `#A3E4D7`
- **Prośby (Działania):** `#E9F7EF`
- **Osądy / Szakal (Myśli):** `#D1D5DB`

### Tła i Bazy (Neutralne)

- **Background Primary:** `#F9F9F7` (Oatmeal Beige).
- **Background Secondary:** `#F0EFEB` (Soft Stone).
- **Surface / Card (Kafelki):** `rgba(255, 255, 255, 0.85)` z efektem `backdrop-blur`.

---

## 3. Typografia

- **Fonty:** **Inter** lub **Plus Jakarta Sans** (zaokrąglone detale).
- **Hierarchia:**
  - Nagłówki (H1): `24px - 32px`, `500` (Medium).
  - Etykiety kart: `16px`, `600` (Semi-Bold).
  - Tekst pomocniczy: `14px`, `400` (Regular), `line-height: 1.6`.

---

## 4. Wytyczne UI (React Flow)

- **Kształt:** `border-radius: 24px` (zaokrąglone kafelki).
- **Obramowanie:** `1px solid rgba(0,0,0,0.05)`.
- **Cienie:** `box-shadow: 0 10px 40px rgba(0,0,0,0.03)` (miękkie światło).
- **Połączenia (Edges):** `2px` grubości, kolor `#BDC3C7`, wygładzone krzywe typu "Smoothstep".

---

## 5. Układ

- **Siatka:** Delikatne, kropkowane tło `#E5E4E2`.
- **Sidebary:** Modularne bloki typu "Bento", zapewniające przejrzystość w wyborze typów kafelków (Obserwacja, Uczucie, Potrzeba, Prośba).
