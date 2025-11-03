# Skillshare andmebaasi täitmine

Skript genereerib Skillshare-laadse õppeplatvormi andmebaasi jaoks realistlikud testandmed. Peamine eesmärk on luua vähemalt 2 miljonit rida kasutajate kursustesse registreerimise (`user_courses`) tabelisse.

## Eeldused

- MySQL 8.0 või uuem
- Bun 1.0 või uuem 
- Node.js 18 või uuem

## Paigaldamine

1. Klooni repo
2. Lisa vajalikud sõltuvused:
```bash
bun install @faker-js/faker
```

## Andmebaasi ettevalmistamine

1. Loo andmebaas:
```sql
CREATE DATABASE Skillshare;
USE Skillshare;
```

2. Impordi skeem:
```bash
mysql -u root -p Skillshare < dump.sql
```

## Andmete genereerimine

Käivita seemneskript:
```bash
bun run seed.js
```

## Oodatavad mahud

- `user_courses`: ~2 000 000 rida (kursustesse registreerimised)
- `users`: ~21 000 rida (1000 õpetajat + 20000 õpilast)
- `courses`: ~5000 rida (keskmiselt 5 kursust õpetaja kohta)
- `reviews`: ~500 000 rida (ligikaudu 25% registreerumistest jätavad tagasiside)

## Andmete kvaliteet

- Kasutajatel on realistlikud nimed ja meiliaadressid
- Kursustel on mõistlikud pealkirjad ja kirjeldused
- Kuupäevad on loogilises järjekorras (kursus ei saa alata enne õpetaja liitumist)
- Hinnangud on 1-5 skaalal, kommentaarid on sisukad
- Kõik võõrvõtmed on korrektsed (orvukirjeid ei esine)

## Jõudlus

- Andmed sisestatakse 1000-kaupa partiidena
- Sisestamise ajaks on indeksid minimeeritud
- Kogu protsess võtab aega ~10-15 minutit

## Veaotsing

Kui tekib viga "Too many connections", siis suurenda MySQL max_connections väärtust:
```sql
SET GLOBAL max_connections = 1000;
```