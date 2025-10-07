// scripts/importFaculties.js
require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = require('../util/database');
const Faculty = require('../models/Faculty');
const University = require('../models/University');

async function importFaculties() {
    try {
        await sequelize.authenticate();
        console.log('✅ Połączono z bazą danych');

        const universities = await University.findAll();
        console.log(`📘 Znaleziono ${universities.length} uczelni w bazie`);

        for (const uni of universities) {
            const encodedName = encodeURIComponent(uni.university_name);
            const url = `https://radon.nauka.gov.pl/opendata/polon/courses?resultNumbers=50&leadingInstitutionName=${encodedName}`;

            console.log(`🏫 Przetwarzanie: ${uni.university_name}`);

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();

                if (!data.results) {
                    console.log(`❌ Brak wyników dla ${uni.university_name}`);
                    continue;
                }

                for (const course of data.results) {
                    if (course.organizationalUnits) {
                        for (const unit of course.organizationalUnits) {
                            const fullName = unit.organizationalUnitFullName;
                            // Zakładamy, że wydział jest po średniku, np "Akademia Łomżyńska; Wydział Nauk Informatyczno-Technologicznych"
                            const parts = fullName.split(';').map(s => s.trim());
                            if (parts.length > 1) {
                                const facultyName = parts[1];

                                // Sprawdzamy czy wydział już istnieje
                                const [faculty, created] = await Faculty.findOrCreate({
                                    where: { faculty_name: facultyName, university_id: uni.university_id }
                                });

                                if (created) {
                                    console.log(`✅ Dodano wydział: ${facultyName}`);
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.log(`❌ Błąd podczas przetwarzania ${uni.university_name}: ${err.message}`);
            }
        }

        console.log('🎯 Zakończono import wydziałów');
    } catch (err) {
        console.error('Błąd połączenia z bazą danych:', err);
    } finally {
        await sequelize.close();
    }
}

importFaculties();
