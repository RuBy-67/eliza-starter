import { Character, Clients, ModelProviderName } from "@elizaos/core";
import mysql from "mysql2/promise";

// Configuration de la base de données
const db = mysql.createPool({
    host: "192.168.1.125",
    user: "wsl",
    password: "wslconnexion",
    database: "character_sodara",
});

// Fonction générique pour récupérer les données de plusieurs tables en parallèle
const fetchData = async (tables: string[]): Promise<Record<string, any[]>> => {
    try {
        const queries = tables.map((table) => `SELECT * FROM ${table}`);
        const results = await Promise.all(queries.map((query) => db.query(query)));
        return tables.reduce((acc, table, index) => {
            acc[table] = results[index][0] as any[];
            return acc;
        }, {} as Record<string, any[]>);
    } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        return tables.reduce((acc, table) => {
            acc[table] = [];
            return acc;
        }, {} as Record<string, any[]>);
    }
};

// Génération du caractère
export const character = (async (): Promise<Character> => {
    // Tables nécessaires
    const tables = [
        "character_adjectives",
        "character_knowledge",
        "character_bio",
        "character_lore",
        "character_messageexamples",
        "character_postexamples",
        "character_style",
        "character_topics",
    ];

    // Récupérer toutes les données en parallèle
    const data = await fetchData(tables);

    // Organiser les données
    return {
        name: "Sodara",
        plugins: [],
        clients: [Clients.DISCORD],
        modelProvider: ModelProviderName.GOOGLE,
        settings: {
            secrets: {},
            voice: {
                model: "en_US-hfc_female-medium",
            },
        },
        system: "Sodara Helpfull AI Assistant",
        bio: data.character_bio.map((row: any) => row.content),
        lore: data.character_lore.map((row: any) => row.content),
        messageExamples: data.character_messageexamples.map((row: any) => [
            {
                user: row.user,
                content: JSON.parse(row.content),
            },
        ]),
        postExamples: data.character_postexamples.map((row: any) => row.content),
        adjectives: data.character_adjectives.map((row: any) => row.content),
        topics: data.character_topics.map((row: any) => row.content),
        knowledge: data.character_knowledge.map((row: any) => row.content),
        style: data.character_style.reduce(
            (acc: any, row: any) => {
                acc[row.type] = acc[row.type] || [];
                acc[row.type].push(row.content);
                return acc;
            },
            { all: [], chat: [], post: [] }
        ),
    };
})();
