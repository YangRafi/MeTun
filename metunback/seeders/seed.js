const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../secret.env' }); // ⬅️ Wczytaj zmienne środowiskowe
const sequelize = require('../util/database');
const models = require('../models');
const universitiesData = require('./universities.json');

const importFaculties = require('./importFaculties');
const importDisciplines = require('./importDisciplines');
const { getNextExpiryDate } = require('../util/dateUtils');

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

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function seed() {
  try {
    // 🏗️ 1️⃣ Utwórz bazę danych, jeśli nie istnieje
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306,
    });

    await connection.query(`
      CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log(`✅ Baza danych '${process.env.DB_NAME}' gotowa.`);
    await connection.end();

    // 🧹 2️⃣ Wyczyść i zsynchronizuj bazę
    await sequelize.sync({ force: true });
    console.log('🧹 Baza danych wyczyszczona i gotowa.');

    // 3️⃣ Uczelnie
    const universities = [];
    for (const uni of universitiesData) {
      const created = await University.create({
        university_name: uni.name,
        location: uni.location || null,
        type: uni.type || 'Publiczna',
      });
      universities.push(created);
    }
    console.log(`✅ Dodano ${universities.length} uczelni z pliku JSON.`);

    // 4️⃣ Admin systemu
    const admin = await User.create({
      name: 'System',
      surname: 'Admin',
      email: 'admin@system.com',
      password: bcrypt.hashSync('Admin123', 10),
      role: 'admin',
    });

    await Profile.create({
      user_id: admin.user_id,
      name: 'System Admin',
      bio: 'Administrator systemu – zarządza weryfikacją uczelni i użytkowników',
      gender: 'male',
      location: 'Białystok',
      profile_picture: `${BASE_URL}/uploads/profile_pictures/admin.jpg`,
      date_of_birth: new Date(1990, 0, 1),
    });

    console.log('✅ Dodano admina.');

    // 5️⃣ Użytkownicy i profile
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
      { name: 'Paweł', surname: 'Lis', email: 'pawel@test.com', password: 'Ebeebe1', gender: 'male', location: 'Łódź', bio: 'Miłośnik muzyki', photo: '16.jpg' },
    ];

    for (const data of userData) {
      const user = await User.create({
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: bcrypt.hashSync(data.password, 10),
        role: 'user',
      });

      await Profile.create({
        user_id: user.user_id,
        name: data.name,
        bio: data.bio,
        gender: data.gender,
        location: data.location,
        profile_picture: `${BASE_URL}/uploads/profile_pictures/${data.photo}`,
        date_of_birth: new Date(
          1998 + Math.floor(Math.random() * 6),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1
        ),
      });

      users.push(user);
    }

    console.log(`✅ Dodano ${users.length} użytkowników i profile.`);

    // 6️⃣ Import danych z API
    console.log('🌐 Importowanie wydziałów z API...');
    await importFaculties();

    console.log('🌐 Importowanie kierunków z API...');
    await importDisciplines();

    // 7️⃣ Przypisanie uczelni i kierunków (status approved)
    const disciplineIds = [177, 193, 201]; // przykładowe ID kierunków
    for (let i = 0; i < users.length; i++) {
      const disciplineId = disciplineIds[i % disciplineIds.length];
      const joinDate = new Date();
      const expiryDate = getNextExpiryDate(joinDate);

      await UserUniversity.create({
        user_id: users[i].user_id,
        university_id: 14, // Politechnika Białostocka
        faculty_id: 53,
        discipline_id: disciplineId,
        status: 'approved',
        join_date: joinDate,
        expiry_date: expiryDate,
        document_url: `${BASE_URL}/uploads/documents/example_student_id.jpg`,
      });
    }
    console.log(`✅ Przypisano uczelnię i kierunki użytkownikom (zweryfikowane).`);

    // 8️⃣ Automatyczne grupy
    for (const disciplineId of disciplineIds) {
      const existingGroup = await Group.findOne({ where: { discipline_id: disciplineId } });
      if (!existingGroup) {
        const discipline = await Discipline.findByPk(disciplineId);
        if (!discipline) continue;

        const newGroup = await Group.create({
          group_name: `Grupa kierunku ${discipline.name}`,
          discipline_id: disciplineId,
        });

        const usersInDiscipline = users.filter((u, index) => disciplineIds[index % disciplineIds.length] === disciplineId);
        for (const user of usersInDiscipline) {
          await GroupMember.create({
            group_id: newGroup.group_id,
            user_id: user.user_id,
            role: 'member',
          });
        }

        console.log(`✅ Utworzono grupę dla kierunku: ${discipline.name} (${usersInDiscipline.length} członków).`);
      }
    }

    // 9️⃣ Przykładowe dopasowania
    for (let i = 0; i < users.length - 1; i++) {
      await UserMatch.create({
        user_id_1: users[i].user_id,
        user_id_2: users[i + 1].user_id,
        user_1_like: true,
        user_2_like: true,
        match_active: true,
      });
    }

    console.log('🎉 SEEDOWANIE zakończone pomyślnie!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Błąd podczas seedowania:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
