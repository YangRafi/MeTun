const bcrypt = require('bcryptjs');
const sequelize = require('../util/database');
const models = require('../models');
const universitiesData = require('./universities.json');

const importFaculties = require('./importFaculties');
const importDisciplines = require('./importDisciplines');

const { 
  User, 
  Profile, 
  University, 
  Faculty, 
  Discipline, 
  Group, 
  UserUniversity, 
  UserMatch, 
  GroupMember 
} = models;

// 👇 Ustal adres backendu (możesz zmienić, jeśli masz inny port)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('🧹 Baza danych wyczyszczona i gotowa.');

    // 1️⃣ Uczelnie
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

    // 2️⃣ Użytkownicy i profile
    const users = [];
    const userData = [
      { name: 'Anna', surname: 'Nowak', email: 'anna@test.com', password: 'Ebeebe1', gender: 'female', location: 'Warszawa', bio: 'Miłośniczka nauki', photo: '1.jpg' },
      { name: 'Kasia', surname: 'Lewandowska', email: 'kasia@test.com', password: 'Ebeebe1', gender: 'female', location: 'Poznań', bio: 'Pasja do designu', photo: '2.jpg' },
      { name: 'Ola', surname: 'Kamińska', email: 'ola@test.com', password: 'Ebeebe1', gender: 'female', location: 'Łódź', bio: 'Uwielbia podróże', photo: '3.jpg' },
      { name: 'Magda', surname: 'Wiśniewska', email: 'magda@test.com', password: 'Ebeebe1', gender: 'female', location: 'Gdańsk', bio: 'Fanka psychologii', photo: '4.jpg' },
      { name: 'Julia', surname: 'Kowalczyk', email: 'julia@test.com', password: 'Ebeebe1', gender: 'female', location: 'Kraków', bio: 'Uwielbia czytać książki', photo: '5.jpg' },
      { name: 'Zuzia', surname: 'Mazur', email: 'zuzia@test.com', password: 'Ebeebe1', gender: 'female', location: 'Wrocław', bio: 'Kocham zwierzęta', photo: '6.jpg' },
      { name: 'Natalia', surname: 'Wójcik', email: 'natalia@test.com', password: 'Ebeebe1', gender: 'female', location: 'Lublin', bio: 'Studentka filologii angielskiej', photo: '7.jpg' },
      { name: 'Marta', surname: 'Kaczmarek', email: 'marta@test.com', password: 'Ebeebe1', gender: 'female', location: 'Białystok', bio: 'Uwielbia sztukę i podróże', photo: '8.jpg' },

      { name: 'Jan', surname: 'Kowalski', email: 'jan@test.com', password: 'Ebeebe1', gender: 'male', location: 'Białystok', bio: 'Student informatyki', photo: '9.jpg' },
      { name: 'Piotr', surname: 'Wiśniewski', email: 'piotr@test.com', password: 'Ebeebe1', gender: 'male', location: 'Gdańsk', bio: 'Lubi backend', photo: '10.jpg' },
      { name: 'Tomek', surname: 'Zieliński', email: 'tomek@test.com', password: 'Ebeebe1', gender: 'male', location: 'Kraków', bio: 'Entuzjasta AI', photo: '11.jpg' },
      { name: 'Michał', surname: 'Dąbrowski', email: 'michal@test.com', password: 'Ebeebe1', gender: 'male', location: 'Warszawa', bio: 'Pasja do sportu', photo: '12.jpg' },
      { name: 'Kuba', surname: 'Król', email: 'kuba@test.com', password: 'Ebeebe1', gender: 'male', location: 'Poznań', bio: 'Uwielbia podróżować', photo: '13.jpg' },
      { name: 'Mateusz', surname: 'Sikora', email: 'mateusz@test.com', password: 'Ebeebe1', gender: 'male', location: 'Wrocław', bio: 'Fan motoryzacji', photo: '14.jpg' },
      { name: 'Bartek', surname: 'Nowicki', email: 'bartek@test.com', password: 'Ebeebe1', gender: 'male', location: 'Lublin', bio: 'Lubi gry komputerowe', photo: '15.jpg' },
      { name: 'Paweł', surname: 'Lis', email: 'pawel@test.com', password: 'Ebeebe1', gender: 'male', location: 'Łódź', bio: 'Miłośnik muzyki', photo: '16.jpg' }
    ];

    for (const data of userData) {
      const user = await User.create({
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: bcrypt.hashSync(data.password, 10)
      });

      await Profile.create({
        user_id: user.user_id,
        name: data.name,
        bio: data.bio,
        gender: data.gender,
        location: data.location,
        // 👇 pełny URL do zdjęcia
        profile_picture: `${BASE_URL}/uploads/profile_pictures/${data.photo}`,
        date_of_birth: new Date(
          1998 + Math.floor(Math.random() * 6),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1
        )
      });

      users.push(user);
    }

    console.log(`✅ Dodano ${users.length} użytkowników i profile.`);

    // 3️⃣ Grupa testowa
    const group = await Group.create({
      group_name: 'Programiści PB',
      creator_user_id: users[0].user_id
    });

    for (let i = 0; i < users.length; i++) {
      await GroupMember.create({
        group_id: group.group_id,
        user_id: users[i].user_id,
        role: i === 0 ? 'admin' : 'member'
      });
    }
    console.log(`✅ Dodano ${users.length} członków do grupy.`);

    // 4️⃣ Import faktycznych danych
    console.log('🌐 Importowanie wydziałów z API...');
    await importFaculties();

    console.log('🌐 Importowanie kierunków z API...');
    await importDisciplines();

    // 5️⃣ Przypisanie uczelni i kierunków
    const disciplineIds = [177, 193, 201]; // Matematyka stosowana, Informatyka, Informatyka i ekonometria
    for (let i = 0; i < users.length; i++) {
      const disciplineId = disciplineIds[i % disciplineIds.length];
      await UserUniversity.create({
        user_id: users[i].user_id,
        university_id: 14, // Politechnika Białostocka
        faculty_id: 53,
        discipline_id: disciplineId
      });
    }
    console.log(`✅ Przypisano uczelnię i kierunki użytkownikom.`);

    // 6️⃣ Przykładowe dopasowania
    for (let i = 0; i < users.length - 1; i++) {
      await UserMatch.create({
        user_id_1: users[i].user_id,
        user_id_2: users[i + 1].user_id,
        user_1_like: true,
        user_2_like: true,
        match_active: true
      });
    }

    console.log('🎉 SEEDOWANIE zakończone pomyślnie!');
    process.exit();
  } catch (err) {
    console.error('❌ Błąd podczas seedowania:', err);
  } finally {
    await sequelize.close();
  }
}

seed();
