// seeders / scripts / importDisciplines.js
const https = require('https');
const sequelize = require('../util/database');
const Discipline = require('../models/Discipline');
const Faculty = require('../models/Faculty');
const University = require('../models/University');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', err => reject(err));
  });
}

async function fetchAndInsertDisciplines(university) {
  try {
    const encodedName = encodeURIComponent(university.university_name);
    const url = `https://radon.nauka.gov.pl/opendata/polon/courses?resultNumbers=50&leadingInstitutionName=${encodedName}`;

    const data = await fetchJson(url);

    if (!data.results) {
      console.log(`⚠️ Brak danych dla uczelni: ${university.university_name}`);
      return;
    }

    for (const course of data.results) {
      const courseName = course.courseName;

      if (!course.organizationalUnits || course.organizationalUnits.length === 0) {
        console.log(`Brak wydziału dla kursu: ${courseName}`);
        continue;
      }

      for (const unit of course.organizationalUnits) {
        const parts = unit.organizationalUnitFullName.split(';');
        const facultyName = parts[1] ? parts[1].trim() : parts[0].trim();

        // Szukamy wydziału w bazie, który należy do tej uczelni
        const faculty = await Faculty.findOne({
          where: {
            faculty_name: facultyName,
            university_id: university.university_id
          }
        });

        if (!faculty) {
          console.log(`❌ Nie znaleziono wydziału: ${facultyName} (uczelnia: ${university.university_name})`);
          continue;
        }

        // Tworzymy rekord w Discipline, unikając duplikatów
        const [discipline, created] = await Discipline.findOrCreate({
          where: {
            faculty_id: faculty.faculty_id,
            name: courseName
          }
        });

        if (created) {
          console.log(`✅ Dodano kierunek: ${courseName} ➜ ${facultyName}`);
        }
      }
    }
  } catch (err) {
    console.error(`❌ Błąd przy przetwarzaniu uczelni "${university.university_name}":`, err.message);
  }
}

async function importDisciplines() {
  try {
    //await sequelize.authenticate();
    console.log('✅ Połączono z bazą danych');

    const universities = await University.findAll();
    console.log(`🎓 Znaleziono ${universities.length} uczelni w bazie`);

    for (const uni of universities) {
      console.log(`\n🏫 Importowanie kierunków dla: ${uni.university_name}`);
      await fetchAndInsertDisciplines(uni);
    }

    console.log('\n🎯 Import kierunków zakończony pomyślnie!');
  } catch (err) {
    console.error('❌ Błąd podczas importu kierunków:', err);
  } 
}

// Pozwala uruchamiać plik samodzielnie lub jako moduł w seed.js
if (require.main === module) {
  importDisciplines();
}

module.exports = importDisciplines;
