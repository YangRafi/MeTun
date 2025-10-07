const bcrypt = require('bcryptjs');
const models = require('../models'); // importujemy wszystko z index.js
const sequelize = require('../util/database'); // połączenie do bazy
const universitiesData = require('./universities.json');

const { User, Profile, University, Faculty, Discipline, Group, UserDiscipline, UserUniversity, GroupMember, UserMatch } = models;

async function seed() {
    try {
        // 1. Tworzymy tabele od nowa
        await sequelize.sync({ force: true });
        console.log("Baza gotowa, start seedowania...");

        // 2. Seedowanie uczelni
        const universities = [];
        for (const uni of universitiesData) {
            const createdUni = await University.create({
                university_name: uni.name,
                location: uni.location || null,
                type: uni.type || "Publiczna"
            });
            universities.push(createdUni);
        }

        console.log(`✅ Dodano ${universities.length} uczelni z pliku JSON`);

        // 3. Seedowanie wydziałów
        const fac1 = await Faculty.create({ faculty_name: "Wydział Informatyki"});
        const fac2 = await Faculty.create({ faculty_name: "Wydział Matematyki" });
        // const fac1 = await Faculty.create({ faculty_name: "Wydział Informatyki", university_id: uni1.university_id });
        // const fac2 = await Faculty.create({ faculty_name: "Wydział Matematyki", university_id: uni2.university_id });

        // 4. Seedowanie kierunków (Discipline = StudyField)
        const disc1 = await Discipline.create({ name: "Informatyka", faculty_id: fac1.faculty_id });
        const disc2 = await Discipline.create({ name: "Matematyka", faculty_id: fac2.faculty_id });
        const disc3 = await Discipline.create({ name: "Ekonomia", faculty_id: fac2.faculty_id });
        const disc4 = await Discipline.create({ name: "Filologia Angielska", faculty_id: fac1.faculty_id });
        const disc5 = await Discipline.create({ name: "Prawo", faculty_id: fac1.faculty_id });

        // 5. Seedowanie użytkowników
        const user1 = await User.create({ name: "Jan", surname: "Kowalski", email: "jan@test.com", password: "1234" });
        const user2 = await User.create({ name: "Anna", surname: "Nowak", email: "anna@test.com", password: "1234" });
        const user3 = await User.create({ name: "Piotr", surname: "Wiśniewski", email: "piotr@test.com", password: "1234" });

        // 6. Seedowanie profili
        await Profile.create({ user_id: user1.user_id, name: "Janek", bio: "Lubi kodować", gender: "male", location: "Białystok" });
        await Profile.create({ user_id: user2.user_id, name: "Ania", bio: "Kocham matematykę", gender: "female", location: "Warszawa" });
        await Profile.create({ user_id: user3.user_id, name: "Piotrek", bio: "Fan algorytmów", gender: "male", location: "Białystok" });

        // 7. Seedowanie grup
        const group1 = await Group.create({ group_name: "Programiści PB", creator_user_id: user1.user_id, discipline_id: disc1.discipline_id });
        const group2 = await Group.create({ group_name: "Matematycy UW", creator_user_id: user2.user_id, discipline_id: disc2.discipline_id });

        // 8. Relacje wielu-do-wielu: UserDiscipline
        await user1.addDiscipline(disc1);
        await user2.addDiscipline(disc2);
        await user3.addDiscipline(disc1);
        await user3.addDiscipline(disc2);

        // 9. Relacje wielu-do-wielu: UserUniversity (z discipline_id)
        // await user1.addUniversity(uni1, { through: { discipline_id: disc1.discipline_id } });
        // await user2.addUniversity(uni2, { through: { discipline_id: disc2.discipline_id } });
        // await user3.addUniversity(uni1, { through: { discipline_id: disc1.discipline_id } });
        // await user3.addUniversity(uni2, { through: { discipline_id: disc2.discipline_id } });

        // 10. Relacje wielu-do-wielu: GroupMember
        await group1.addUser(user1, { through: { role: "creator", join_date: new Date() } });
        await group1.addUser(user3, { through: { role: "member", join_date: new Date() } });
        await group2.addUser(user2, { through: { role: "creator", join_date: new Date() } });
        await group2.addUser(user3, { through: { role: "member", join_date: new Date() } });

        // 11. Relacje wielu-do-wielu: UserMatch
        await user1.addMatchedUsers(user2, { through: { match_date: new Date(), is_active: true } });
        await user1.addMatchedUsers(user3, { through: { match_date: new Date(), is_active: true } });
        await user2.addMatchedUsers(user3, { through: { match_date: new Date(), is_active: false } });

        console.log("✅ Seedowanie zakończone z pełnymi relacjami!");
        process.exit();
    } catch (err) {
        console.error("❌ Błąd seedowania:", err);
    }
}

seed();
