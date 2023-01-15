const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const neo4j = require('neo4j-driver');

const app = express();
dotenv.config();

//  View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic(process.env.NEO_USERNAME, process.env.NEO_PASSWORD));
const session = driver.session();

app.get('/', async (req, res) => {

    try {
        const moviesResult = await session.run('MATCH (n:Movie) RETURN n LIMIT 25');
        
        const movies = [];
        moviesResult.records.forEach(record => {
            movies.push({
                id: record._fields[0].identity.low,
                title: record._fields[0].properties.title,
                year: record._fields[0].properties.year
            });
        });

        const actorsResult = await session.run('MATCH (n:Actor) RETURN n LIMIT 25');
        
        const actors = [];
        actorsResult.records.forEach(record => {
            actors.push({
                id: record._fields[0].identity.low,
                name: record._fields[0].properties.name
            });
        });

        res.render('index', {
            movies,
            actors
        });
    } catch (error) {
        console.log(error);
    } finally {
        await session.close()
    }
});

app.post('/movie/add', async (req, res) => {
    const { movie_title, movie_year } = req.body;

    try {
        const result = await session.run(
            'CREATE (n:Movie {title: $title, year: $year}) RETURN n',
            { title: movie_title, year: movie_year }
        );
        
        res.redirect('/');
    } catch (error) {
        console.log(error);
    } finally {
        await session.close()
    }
});

app.post('/actor/add', async (req, res) => {
    const { actor_name } = req.body;

    try {
        const result = await session.run(
            'CREATE (n:Actor {name: $name}) RETURN n',
            { name: actor_name }
        );
        
        res.redirect('/');
    } catch (error) {
        console.log(error);
    } finally {
        await session.close()
    }
});

app.post('/movie/actor/add', async (req, res) => {
    const { actor_name, movie_title } = req.body;

    try {
        const result = await session.run(
            'MATCH (a:Actor {name: $name}), (m:Movie {title: $title}) CREATE (a)-[r:ACTED_IN]->(m) RETURN a,m',
            { name: actor_name, title: movie_title }
        );
        
        res.redirect('/');
    } catch (error) {
        console.log(error);
    } finally {
        await session.close()
    }
});

app.listen(3000, () => console.log('Server running on port 3000...'));