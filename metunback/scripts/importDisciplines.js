const https = require('https');
const sequelize = require('../util/database');
const Discipline = require('../models/Discipline');
const Faculty = require('../models/Faculty');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', err => reject(err));
  });
}

async function fetchAndInsertDisciplines(universityName) {
  try {
    const encodedName = encodeURIComponent(universityName);
    const url = `https://radon.nauka.gov.pl/opendata/polon/courses?resultNumbers=50&leadingInstitutionName=${encodedName}`;

    const data = await fetchJson(url);

    for (const course of data.results) {
      const courseName = course.courseName;

      if (!course.organizationalUnits || course.organizationalUnits.length === 0) {
        console.log(`Brak wydziału dla kursu: ${courseName}`);
        continue;
      }

      for (const unit of course.organizationalUnits) {
        const parts = unit.organizationalUnitFullName.split(';');
        const facultyName = parts[1] ? parts[1].trim() : parts[0].trim();

        const faculty = await Faculty.findOne({ where: { faculty_name: facultyName } });

        if (!faculty) {
          console.log(`Nie znaleziono wydziału: ${facultyName} dla kursu: ${courseName}`);
          continue;
        }

        // Tworzymy rekord w Discipline
        await Discipline.findOrCreate({
          where: {
            faculty_id: faculty.faculty_id,
            name: courseName   // poprawione z faculty_name na name
          }
        });

        console.log(`Dodano kierunek: ${courseName} do wydziału: ${facultyName}`);
      }
    }
  } catch (err) {
    console.error('Błąd przy pobieraniu lub wstawianiu danych:', err);
  }
}

// Przykład użycia
(async () => {
  await sequelize.sync();
  const universities = ['Akademia Łomżyńska', 'Uniwersytet Warszawski'];
  for (const uni of universities) {
    await fetchAndInsertDisciplines(uni);
  }
})();
