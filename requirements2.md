SQL SELECT Päringute Harjutus
Eesmärk: koosta 6 SELECT päringut enda andmebaasiskeema kohta, mis annaksid kasulikku infot. Harjutuse mõte on õppida koostama päringuid, mis annavad andmebaasist kasulikku infot.

Alljärgnevad näited on raamatukogusüsteemi andmebaasi põhised. Teie päringud peavad olema teie enda andmebaasi põhised.

Lahendus tuleb esitada enda projekti Githubi repos failis nimega queries.sql, main harus.

❌ VALED NÄITED ja põhjused, miks need ei ole relevantsed raamatukogusüsteemi puhul:
VALE Päring 1: Ebaoluline filtreerimine
-- Leia raamatud, mille ID on suurem kui 100
SELECT * FROM books WHERE id > 100;
❌ Miks see on VALE:

ID järgi filtreerimine ei ole kasutajale ega süsteemile kunagi oluline
Raamatukogu töötaja ei küsi kunagi "näita mulle raamatuid, mille ID on üle 100"
Päring ei lahenda ühtegi reaalset vajadust
ID on tehniline väli, mitte äriloogiline
✅ MIS OLEKS ÕIGE:

-- Leia raamatud, mis on praegu saadaval laenutamiseks
SELECT title, isbn, copies_available, publication_year
FROM books
WHERE copies_available > 0
ORDER BY title;
-- See on kasulik: raamatukoguhoidja näeb, milliseid raamatuid saab välja laenutada
✅ MIS OLEKS ÕIGE:

-- Leia liikmed koos nende hetkel laenutatud raamatutega
SELECT 
    m.first_name,
    m.last_name,
    b.title,
    l.loan_date,
    l.due_date
FROM members m
JOIN loans l ON m.id = l.member_id
JOIN books b ON l.book_id = b.id
WHERE l.status = 'active' AND l.return_date IS NULL;
-- See on kasulik: näitab, kel on hetkel raamatud käes
VALE Päring: Ebaoluline statistika
-- Leia kõigi autorite keskmine sünniaaasta
SELECT AVG(birth_year) as avg_birth_year
FROM authors;
❌ Miks see on VALE:

See statistika ei ole raamatukogu seisukohast mitte kunagi vajalik
Keegi ei küsi: "Mis on meie autorite keskmine sünniaaasta?"
See ei aita raamatukogu toimimist ega kasutajaid
Päring on tehniliselt õige, aga mõttetu projekti kontekstis
✅ MIS OLEKS ÕIGE:

-- Leia iga kategooria raamatute arv ja saadavate koopiate arv
SELECT 
    c.name as category,
    COUNT(b.id) as total_books,
    SUM(b.copies_available) as available_copies
FROM categories c
LEFT JOIN books b ON c.id = b.category_id
GROUP BY c.id, c.name
ORDER BY total_books DESC;
-- See on kasulik: raamatukoguhoidja näeb, millistes kategooriates on raamatuid
VALE Päring: Vale grupeerimine
-- Grupeeri raamatud pealkirja esimese tähe järgi
SELECT 
    LEFT(title, 1) as first_letter,
    COUNT(*) as book_count
FROM books
GROUP BY LEFT(title, 1);
❌ Miks see on VALE:

Kuigi tehniliselt töötab, ei ole see raamatukogu jaoks praktiline
Esitähe järgi grupeerimine ei anna kasulikku informatsiooni
Raamatukogus on olulisem grupeerida kategooriate, autorite või laenutusstatistika järgi
See ei vasta projekti vajadustele
✅ MIS OLEKS ÕIGE:

-- Leia liikmed, kes on laenutanud rohkem kui 10 raamatut
SELECT 
    m.id,
    m.first_name,
    m.last_name,
    COUNT(l.id) as total_loans,
    COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_loans
FROM members m
JOIN loans l ON m.id = l.member_id
GROUP BY m.id, m.first_name, m.last_name
HAVING COUNT(l.id) > 10
ORDER BY total_loans DESC;
-- See on kasulik: leiame aktiivsed lugejad, kellele võiks soovitada uusi raamatuid
VALE Päring 5: Vale JOIN loogika
-- Leia kõik autorid koos kategooriatega
SELECT a.first_name, a.last_name, c.name
FROM authors a
JOIN categories c ON a.id = c.id;
❌ Miks see on VALE:

JOIN tingimus a.id = c.id on mõttetu - autor ei ole seotud kategooriaga ID kaudu
Autorid on seotud raamatutega, raamatud kategooriatega
Päring näitab, et õpilane ei mõista andmebaasi struktuuri
Tulemus oleks juhuslik ja vale
✅ MIS OLEKS ÕIGE:

-- Leia autorid koos nende kirjutatud raamatute kategooriatega
SELECT 
    a.first_name,
    a.last_name,
    b.title,
    c.name as category
FROM authors a
JOIN book_authors ba ON a.id = ba.author_id
JOIN books b ON ba.book_id = b.id
JOIN categories c ON b.category_id = c.id
ORDER BY a.last_name, b.title;
-- See on kasulik: näitab, millistes žanrites igaüks autor kirjutab
VALE Päring 6: Üleliigne komplekssus
-- Leia raamatud, mille pealkirjas on täht 'a'
SELECT * FROM books
WHERE title LIKE '%a%'
  AND id IN (
    SELECT book_id FROM loans
    WHERE member_id IN (
      SELECT id FROM members WHERE email LIKE '%@gmail.com'
    )
  );
❌ Miks see on VALE:

Otsib raamatuid tähe 'a' järgi - see ei ole kunagi reaalne vajadus
Alamparingud on põhjendamatud - sama tulemuse saaks lihtsamalt
Filtreerimine Gmail-i e-posti järgi pole raamatukogu kontekstis oluline
Päring on keeruline, aga eesmärgitu
✅ MIS OLEKS ÕIGE:

-- Leia enimlaenutatavad raamatud viimase aasta jooksul koos autorite ja statistikaga
SELECT 
    b.title,
    b.isbn,
    GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ') as authors,
    COUNT(l.id) as loan_count,
    AVG(DATEDIFF(COALESCE(l.return_date, CURDATE()), l.loan_date)) as avg_loan_days
FROM books b
JOIN book_authors ba ON b.id = ba.book_id
JOIN authors a ON ba.author_id = a.id
LEFT JOIN loans l ON b.id = l.book_id
WHERE l.loan_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
GROUP BY b.id, b.title, b.isbn
HAVING loan_count > 5
ORDER BY loan_count DESC
LIMIT 10;
-- See on kasulik: raamatukoguhoidja näeb, millised raamatud on kõige populaarsemad
-- ja saab otsustada, kas osta juurde eksemplare
📝 KOKKUVÕTE: Kuidas teha RELEVANTSEID päringud?
✅ Küsi endalt ENNE päringu kirjutamist:
Kes seda päringut kasutaks? (raamatukoguhoidja, liige, admin)
Millal seda vajatakse? (iga päev, aruannete tegemiseks, statistikaks)
Miks see info on oluline? (laenamine, tagastamine, inventuur)
Kas see aitab projekti eesmärki? (raamatukogu efektiivne haldamine)
❌ Valed päringud on sellised, mis:
Filtreerivad tehniliste väljade (ID, created_at) järgi ilma äriloogiketa
Kasutavad tabeleid/välju, mida projekti skeemis ei ole
Arvutavad statistikat, mida keegi ei vaja
Ühendavad tabeleid ilma loogilise seoseta
On keerulised lihtsalt keerukuse pärast
✅ Õiged päringud on sellised, mis:
Lahendasid reaalset probleemi (nt "Millised raamatud on tähtaegselt tagastamata?")
Kasutavad projekti tegelikku skeemi (tabelid ja seosed on õiged)
Annavad kasulikku informatsiooni (statistika, mida saab kasutada otsuste tegemiseks)
On praktikas vajalikud (päris kasutaja/admin vajaks seda funktsiooni)
Nüüd on teie kord: võtke OMA projekt ja koostage 6 päringut, mis on TEIE skeemi jaoks relevandid!

# Kriteeriumid
Kõik päringud töötavad (ei anna erroreid, annavad vähemalt 1 rea tagasi)
Päringute eesmärk on selgelt sõnastatud
Päringud on kasulikud rakenduse kasutajale või administraatorile
Vähemalt 1 päring kasutab WHERE tingimusi
Vähemalt 1 päring kasutab INNER JOIN või LEFT JOIN
Vähemalt 1 päring kasutab agregeerimisfunktsioone (COUNT, SUM, AVG, MAX, MIN)
Vähemalt 1 päring kasutab GROUP BY
Vähemalt 1 päring kasutab HAVING tingimust
Vähemalt 1 päring ühendab 3 või enam tabelit VÕI kasutab alampäringut
Iga päringu kohta on kirjutatud selgitus (milleks seda kasutatakse)
Iga päringu kohta on kirjeldatud oodatav tulemus
Kasutatakse ORDER BY tulemuste sortimiseks, kus see on mõttekas
Kasutatakse LIMIT, kui on vaja piiratud hulka tulemusi
Tulemused on esitatud kasutajasõbralikul kujul (arusaadavad veeru aliased)
Valitakse välja ainult vajalikud veerud (mitte alati SELECT *)
Päringud peavad olema optimeeritud (Kui AI analüüsib SQL päringu ära ja ütleb, et midagi ei saa enam teha, siis on ok)