const GENIUS_ACCESS_TOKEN = window.ENV.ACCESS_TOKEN;
let my_data = [];
let lyrics_arr = [];
let accumulating_lyrics= '';
let time = 0;
var alpha = 100
var searchTerm = "hello";
var song_line = 0;
const query = `${searchTerm}`;
var historical_data = [];
var flag_first_fetched = -1
var rnd = 0;
var rnd_data;
var track_name;
var text_dir = 'ltr';
const WIDTH_ = 800;
const HEIGHT_ = 800;

async function fetchSongs() {
    try {
        const targetUrl = `https://corsproxy.io/?key=?q=${encodeURIComponent(GENIUS_ACCESS_TOKEN)}&url=https%3A%2F%2Fapi.genius.com%2Fsearch?q=${encodeURIComponent(query)}`;


        const response = await fetch(targetUrl, {
            headers: {
                'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });


        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);

        const data = await response.json();
        const hits = data.response.hits;

        if (hits.length > 0) {
            historical_data = Object.fromEntries(
                Object.entries(hits).filter(([key, value]) => {
                    const dateString = value.result.release_date_for_display;
                    const dateObject = new Date(dateString);
                    const yearRelease = dateObject.getFullYear();
                    const yearRelease2 = value.result.release_date_components?.year;
                    return yearRelease <= 2000 || yearRelease2 <= 2000;
                }));

            const songs_to_search =
                Object.entries(historical_data).map(([key, value]) => {
                    const track_name = value.result.title;
                    const artist_name = value.result.primary_artist.name;
                    return { track_name, artist_name };
                })

            return songs_to_search;
        } else {
            console.log("No songs found.");
            return [];
        }
    } catch (error) {
        console.log("Error: " + error.message);
        return [];
    }
}

async function fetchLyrics(song) {
    var query_song_name = song.track_name + " " + song.artist_name;
    var query_song_name_heb = extractLanguagesSeparately(query_song_name).hebrew
    var is_hebrew = (query_song_name_heb.length > 0);
    if (is_hebrew){
        query_song_name = query_song_name_heb.join(" ");
        text_dir='rtl'
    }

    console.log(`Fetching lyrics for: ${query_song_name}`);

    try {
        const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query_song_name)}`);

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        if (data.length > 0) {
            const seen = new Set();
            const uniqueData = data.filter(item => {
                const duplicate = seen.has(item.name);
                seen.add(item.name);
                return !duplicate;
            });

            return uniqueData;
        } else {
            console.log("No lyrics found.");
            return [];
        }
    } catch (error) {
        console.log("Error: " + error.message);
        return [];
    }
}

function extractLanguagesSeparately(text) {
    const regex = /([\u0590-\u05FF]+|[a-zA-Z]+)/g;

    const hebrewWords = [];
    const englishWords = [];

    let match;
    while ((match = regex.exec(text)) !== null) {
        const word = match[0];
        if (/[\u0590-\u05FF]/.test(word)) {
            hebrewWords.push(word);
        } else if (/[a-zA-Z]/.test(word)) {
            englishWords.push(word);
        }
    }

    return { hebrew: hebrewWords, english: englishWords };
}

fetchSongs().then((songs) => {
    songs.forEach(async (song) => {
        const lyrics = await fetchLyrics(song);
        my_data = my_data.concat(lyrics.filter(item => item.plainLyrics));
    });
});

function setup() {
    createCanvas(WIDTH_, HEIGHT_);
    colorMode(HSB, 360, 100, 100, 100);
    background(0, 0, 100);

}

function draw() {

    var seconds = 30

    if (my_data.length > 0 && flag_first_fetched == -1) {
        flag_first_fetched = time;
    }

    if (flag_first_fetched > -1) {
        var timeModulo = (time - flag_first_fetched) % (60 * seconds);
        var timeModuloSongLine = (time - flag_first_fetched) % (60 * (seconds / 5));
        alpha = map(timeModulo, 0, 60 * seconds, 100, 0);
        fill(233, 28, 30, alpha);
        textSize(40);
        var font = "IM Fell DW Pica";
        textFont(font);
        //textDirection(text_dir);
        textAlign(LEFT, TOP);
        noStroke();

        if (timeModulo == 0) {
            song_line = 0;
            accumulating_lyrics ='';
            var rnd_curr = Math.floor(Math.random() * my_data.length)
            while (my_data.length > 1 && rnd == rnd_curr) {
                rnd_curr = Math.floor(Math.random() * my_data.length)
            }
            rnd = rnd_curr;
            rnd_data = my_data[rnd]
            var rand_lyrics = rnd_data.plainLyrics;
            track_name = rnd_data.name;
            lyrics_arr = rand_lyrics.split("\n");
        }

        if (timeModuloSongLine == 0 && song_line < lyrics_arr.length) {
            background(0, 0, 100);
            accumulating_lyrics += `${lyrics_arr[song_line]}\n`
            text(accumulating_lyrics, 50 , 50, WIDTH_, 200);
            song_line += 1;
        }
    }

    time += 1;
}