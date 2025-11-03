# Skillshare andmebaasi täitmine

Skript genereerib Skillshare-laadse õppeplatvormi andmebaasi jaoks realistlikud testandmed. Peamine eesmärk on luua vähemalt 2 000 000 rida tabelisse `user_courses`.

## Eeldused
- Docker & docker-compose (soovitatav)
- MySQL 8.0 või uuem (konteineris või hostis)
- Bun või Node.js
- Sõltuvused: mysql2, @faker-js/faker

## Paigaldamine ja käivitamine (lühike)
1. Kopeeri näidis .env:
```bash
cp .env.example .env
# redigeeri .env vastavalt oma keskkonnale (DB_USER, DB_PASS, DB_NAME, DB_ROOT_PASS)
```

2. Kui kasutad Dockerit, käivita MySQL + phpMyAdmin:
```bash
docker compose up -d
```
- phpMyAdmin on tavaliselt http://localhost:8080 (kasuta .env`is määratud root parooli).

3. Paigalda sõltuvused:
```bash
# Bun
bun add mysql2 @faker-js/faker
# või npm
npm install mysql2 @faker-js/faker
```

4. Käivita seemneskript:
```bash
bun run seed
# või
node seed.js
```

## .env põhilised väljad (näide .env.example)
- DB_HOST (nt 127.0.0.1)
- DB_PORT (3306)
- DB_USER (kokku sobiv kasutaja; Docker compose näidis: myuser)
- DB_PASS (myuser parool)
- DB_ROOT_PASS (root parool, kasutatav DB loomisel)
- DB_NAME (nt mydatabase)
- BATCH_SIZE, TEACHER_COUNT, STUDENT_COUNT, COURSE_COUNT, ENROLLMENT_TARGET

## Kuidas docker-compose .env väärtustega sobitub
Sinu docker-compose määrab:
- MYSQL_DATABASE -> DB_NAME
- MYSQL_USER -> DB_USER
- MYSQL_PASSWORD -> DB_PASS
- MYSQL_ROOT_PASSWORD -> DB_ROOT_PASS

Veendu, et `.env` väärtused ja docker-compose keskkonnamuutujad vastavad üksteisele.

## Kontroll phpMyAdminis
- Ava http://localhost:8080
- Logi sisse root / DB_ROOT_PASS (või muu kasutaja)
- Vali andmebaas (DB_NAME) ja kontrolli tabelite row count (Browse või SQL)

## Oodatavad mahud
- `user_courses`: ~2 000 000 rida
- `users`: ~21 000 rida
- `courses`: ~5 000 rida
- `reviews`: kuni 500 000 rida

## Veaotsing (kõige levinumad)
- phpMyAdmin näitab 0 rida → veendu, et seed.js kasutab sama DB_HOST/DB_PORT/DB_NAME kui phpMyAdmin.
- Permission errors → kontrolli DB_USER/DB_PASS/DB_ROOT_PASS ja et DB on loodud.
- Kui seed käib konteineris, kasuta `.env` seadistust konteineri keskkonnas või käivita seed skript hostist (DB_HOST=127.0.0.1, port 3306).