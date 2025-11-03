Eesmärk
Luua skript (kasuta Bun-i), mis täidab sinu skeemi tabelid realistlike andmetega nii, et vähemalt ühes tabelis on vähemalt 2 000 000 rida ning teistes tabelites võimalikult palju ridu, säilitades tervikluse ja jõudluse.

Nõuded
Vähemalt ühes mitte-lookup tabelis ≥ 2 000 000 rida.
Teistes mitte-lookup tabelites maksimaalne mõistlik maht, proportsioonid põhjendatud.
Andmed peavad välja nägema ehtsad (nimed, e-kirjad, aadressid, summad, kuupäevad, seosed).
Võõrvõtmed kehtivad, orvukirjeid ei ole.
Sisestus toimub partiidena mass-sisestuse võtetega, mitte rida-real.
Indeksite strateegia: minimaalsed sisestuse ajal, taastamine pärast täitmist.
Lahendus peab olema reprodutseeritav (fikseeritud seeme või muu mehhanism).

Repos peavad olema:

dump.sql – skeem.
Seemneskript – skript, mis täidab skeemi suurandmetega.
README.md – samm-sammuline juhend nullist käivitamiseks:

eeldused (andmebaasi versioon, tööriistad, .env väärtused),
käsud andmebaasi loomiseks ja dump’i laadimiseks,
seemneskripti käivitamise juhend,
oodatud tulemus (milline tabel saavutab 2M rida, teiste mahud ka).



Soovituslik töövoog
Skeemi kaardistus: märgi lookup vs mitte-lookup tabelid; joonista sisestusjärjekord.
Andmesünteesi kavand: kirjelda, kuidas genereeritakse igale väljale realistlik väärtus.
Partiipõhine genereerimine: vali partiisuurused, kasuta transaktsioone.
FK-järjekord: sisesta esmalt viidatavad tabelid, siis viitavad tabelid.
Indeksite käsitlemine: mass-sisestuse ajaks minimaalsed indeksid, taastamine hiljem.
Paralleelsus: täida sõltumatuid osi paralleelselt.

# Hindamiskriteeriumid
PASS

Vähemalt ühes mitte-lookup tabelis ≥ 2 000 000 rida.
Teistes mitte-lookup tabelites maksimaalselt mõistlik maht, proportsioonid põhjendatud.
Andmed näevad ehtsad välja.
Võõrvõtmed kehtivad, orvukirjeid ei ole.
Sisestus tehtud partiidena mass-sisestuse võtetega.
Lahendus on reprodutseeritav.
Repo nimi on sisuline, mitte geneeriline.
Repo sisaldab dump.sql, seemneskripti ja README.md.
README.md põhjal saab nullist lahenduse edukalt käima.
READMEs on kirjas milline tabel on 2M, teistes mahud, kestus, ehtsuse ja tervikluse kirjeldus.
FAIL kui näiteks:

Üheski mitte-lookup tabelis ei saavutata 2 000 000 rida.
Teiste tabelite mahud on põhjendamata väikesed.
Andmed ei näe ehtsad välja või esineb võõrvõtmevigu.
Sisestus on tehtud rida-realt.
Lahendus ei ole reprodutseeritav.
Repo nimi on geneeriline või ebasisuline.
Repo puudub või puudub mõni nõutud fail.
README.md ei võimalda nullist käivitamist.
Esitatav
Repo link.
Repo struktuuris dump.sql, seemneskript ja README.md.