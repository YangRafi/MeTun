const bcrypt = require('bcryptjs');
const sequelize = require('../util/database');
const models = require('../models');
const universitiesData = require('./universities.json');

// Importujemy funkcje z pozostałych skryptów:
const importFaculties = require('./importFaculties');
const importDisciplines = require('./importDisciplines');

const { User, Profile, University, Faculty, Discipline, Group } = models;

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('🧹 Baza danych wyczyszczona i gotowa.');

    // 1️⃣ Uczelnie z pliku JSON
    const universities = [];
    for (const uni of universitiesData) {
      const created = await University.create({
        university_name: uni.name,
        location: uni.location || null,
        type: uni.type || 'Publiczna'
      });
      universities.push(created);
    }
    console.log(`✅ Dodano ${universities.length} uczelni z pliku JSON.`);

    // 2️⃣ Użytkownicy
    const user1 = await User.create({
      name: 'Jan',
      surname: 'Kowalski',
      email: 'jan@test.com',
      password: bcrypt.hashSync('1234', 10)
    });

    const user2 = await User.create({
      name: 'Anna',
      surname: 'Nowak',
      email: 'anna@test.com',
      password: bcrypt.hashSync('1234', 10)
    });

    // 3️⃣ Profile
    await Profile.create({
      user_id: user1.user_id,
      name: 'Janek',
      bio: 'Student informatyki',
      gender: 'male',
      location: 'Białystok'
    });

    await Profile.create({
      user_id: user2.user_id,
      name: 'Ania',
      bio: 'Miłośniczka nauki',
      gender: 'female',
      location: 'Warszawa'
    });

    // 4️⃣ Grupy przykładowe
    await Group.create({
      group_name: 'Programiści PB',
      creator_user_id: user1.user_id
    });

    console.log('✅ Wstawiono przykładowych użytkowników i grupy.');

    // 5️⃣ Import faktycznych danych z API
    console.log('🌐 Importowanie wydziałów z API...');
    await importFaculties();

    console.log('🌐 Importowanie kierunków z API...');
    await importDisciplines();

    console.log('🎉 SEEDOWANIE zakończone pomyślnie!');
    process.exit();
  } catch (err) {
    console.error('❌ Błąd podczas seedowania:', err);
  }
}

seed();
