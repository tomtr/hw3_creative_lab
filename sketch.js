const GENIUS_ACCESS_TOKEN = window.ENV.ACCESS_TOKEN;
var font = "IM Fell DW Pica";
let my_data = [];
let lyrics_arr = [];
let accumulating_lyrics = '';
let time = 0;
var alpha = 100
var song_line = 0;
var searchTerm = "";
var historical_data = [];

// (-1) -> not fetched yet, (-2) -> no songs found / http error, (0<) -> songs found
var flag_first_fetched = -1
var rnd = 0;
var rnd_data;
var track_name;
var text_dir = 'ltr';
const WIDTH_ = 1300;
const HEIGHT_ = 700;

let x = 200,
    y = 200;
let centerX = WIDTH_ / 2,
    centerY = HEIGHT_ / 10;

let angle = 0;
let diameter = 100;
let radius = diameter / 2;
let hue = 0;
let movement_rad = 50;
let flag_small = 0;
let max_rad = 200;
let direction = 1;

let queryInput, submit;
const YEAR = 2000;

// Fetch songs according to user query
async function fetchSongs(query) {
    let fetch_URL = `/api/search-songs?q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(fetch_URL);

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        const hits = data.response.hits;

        if (hits.length > 0) {
            historical_data = Object.fromEntries(
                Object.entries(hits).filter(([key, value]) => {
                    const dateString = value.result.release_date_for_display;
                    const dateObject = new Date(dateString);
                    const yearRelease = dateObject.getFullYear();
                    const yearRelease2 = value.result.release_date_components?.year;
                    return yearRelease <= YEAR || yearRelease2 <= YEAR;
                }));

            const songs_to_search =
                Object.entries(historical_data).map(([key, value]) => {
                    const track_name = value.result.title;
                    const artist_name = value.result.primary_artist.name;
                    return { track_name, artist_name };
                })

            var is_empty_historical_data = Object.keys(historical_data).length === 0;
            if (is_empty_historical_data) {
                flag_first_fetched = -2;
                console.log("No songs found.");
                return [];
            }
            return songs_to_search;
        } else {
            flag_first_fetched = -2;

            console.log("No songs found.");
            return [];
        }
    } catch (error) {
        flag_first_fetched = -2;

        console.log("Error: " + error.message);
        return [];
    }
}

// Fetch lyrics for the songs
async function fetchLyrics(song) {
    var query_song_name = song.track_name + " " + song.artist_name;
    var query_song_name_heb = extractLanguagesSeparately(query_song_name).hebrew
    var is_hebrew = (query_song_name_heb.length > 0);
    if (is_hebrew) {
        query_song_name = query_song_name_heb.join(" ");
        text_dir = 'rtl'
    }

    console.log(`Fetching lyrics for: ${query_song_name}`);

    try {
        const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query_song_name)}`);

        if (!response.ok) throw new Error('Network response error: ' + response);

        const data = await response.json();

        if (data.length > 0) {
            const seen = new Set();
            const uniqueData = data.filter(item => {
                const duplicate = seen.has(item.name);
                seen.add(item.name);
                return !duplicate;
            });
           const final_data = filterOutSongs(uniqueData)
           return final_data;
        } else {
            console.log("No lyrics found.");
            return [];
        }
    } catch (error) {
        console.log("Error: " + error.message);
        return [];
    }
}

// Filter out songs with curse words.. thanks Tupac
function filterOutSongs(songsArray) {
  return songsArray.filter(song => {
    const whitelist = ["hell", "damn"];
    const lyrics = song.plainLyrics || "";
    // check if cleaning the text changes it (meaning profanity was found)
    const cleaned = profanityCleaner.clean(lyrics, { exceptions: whitelist });
    const hasProfanity = cleaned !== lyrics;
    return !hasProfanity;
  });
}


// Thanks to gemini for the following function!
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

// Interactive colorful circle
class Thing {
    constructor(centerX, centerY) {
        this.centerX = centerX;
        this.centerY = centerY; 
    }
    show() {
        hue = (time * 2) % 360;
        if (mouseIsPressed) {
            diameter -= 1;
            flag_small = 1;
        } else {
            if (flag_small == 1) {
                max_rad = 500;
                flag_small = 0;
            }
            if (diameter < max_rad) {
                diameter += 1;
            }
        }

        x = centerX;
        y = centerY;

        push();
        fill(hue, 40, 90, 100);
        noStroke();
        blendMode(LIGHTEST);
        circle(x, y, diameter);
        pop();
        angle += (2 * Math.PI * 0.005) % (2 * Math.PI);
    }
}

// For interactive circle
function mouseDragged() {
    (centerX = mouseX), (centerY = mouseY);
}
function mousePressed() {
    (centerX = mouseX), (centerY = mouseY);
}


// Handle Submit button
function handleSubmit() {
    let textEntered = queryInput.value().trim();
    if (textEntered !== "") {
        searchTerm = textEntered;
        const query = `${searchTerm}`;
        queryInput.value('');
        queryInput.remove();
        submit.remove()
        queryTitle.remove()
        queryTitle = '';
        fetchSongs(query).then((songs) => {
            songs.forEach(async (song) => {
                const lyrics = await fetchLyrics(song);
                my_data = my_data.concat(lyrics.filter(item => item.plainLyrics));
                if (my_data.length == 0) {
                    flag_first_fetched = -2
                }

            });
        });

    }
}

// Center things... so complicated
function centerTop(element, top_px) {
    element.style('width', '100%');
    element.style('text-align', 'center');
    element.style('position', 'absolute');
    element.style('top', top_px);
    element.style('margin', '0');
}

async function setup() {
    createCanvas(WIDTH_, HEIGHT_);
    colorMode(HSB, 360, 100, 100, 100);
    background(0, 0, 100);

    // Query for song input
    queryTitle = createP("Pick a word - בחרו מילה")
    centerTop(queryTitle, '10px')

    queryTitle.style('font-size', '90px')
    queryTitle.style('font-family', 'IM Fell DW Pica')

    // Input & submit button
    queryInput = createInput();
    queryInput.style('font-size', '80px')
    queryInput.style('font-family', 'IM Fell DW Pica')
    queryInput.style('height', '1.5em');
    queryInput.style('text-align', 'center');

    centerTop(queryInput, '100px')


    submit = createButton('Submit');
    submit.position(0, 250);
    submit.style('font-size', '80px')
    submit.style('font-family', 'IM Fell DW Pica')
    submit.style('height', '1.5em');
    centerTop(submit, '250px')
    queryInput.changed(handleSubmit);
    submit.mousePressed(handleSubmit);


}

function draw() {


    background(0, 0, 100);
    var seconds = 30

    // handle first successful fetch 
    if (my_data.length > 0 && flag_first_fetched == -1) {
        flag_first_fetched = time;

        // creating colorful interactive circle - doesn't work yet:(
        let thing = new Thing(centerX, centerY);
        thing.show();
    }

    if (flag_first_fetched == -2) {
        text(" no lyrics found:( try again with another word", 50, 50, WIDTH_, 200);
    }

    if (flag_first_fetched > -1) {
        //count time for the fetched song and each song line
        var timeModulo = (time - flag_first_fetched) % (60 * seconds);
        var timeModuloSongLine = (time - flag_first_fetched) % (60 * (seconds / 5));

        // initializing a new song
        if (timeModulo == 0) {
            song_line = 0;
            accumulating_lyrics = '';

            //random song from the fetched list, not the same as the one before
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

        // handling adding more song lines 
        if (timeModuloSongLine == 0 && song_line < lyrics_arr.length) {
            accumulating_lyrics += `${lyrics_arr[song_line]}\n`
            song_line += 1;
        }
    // some text properties
    alpha = map(timeModulo, 0, 60 * seconds, 100, 0);
    // fill(360-hue, 40, 90, alpha);
    fill(0, 0, 0, alpha);
    textSize(50);
    drawingContext.direction = 'ltr';
    textFont(font);
    textAlign(CENTER, TOP);
    noStroke();

        text(accumulating_lyrics, 50, 50, WIDTH_, 200);

        pop();
    }

    time += 1;
}