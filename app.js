// web.js
var express = require("express");
var logfmt = require("logfmt");
var app = express();
app.use(logfmt.requestLogger());
var fs = require('fs');
var Client = require('node-rest-client').Client;
client = new Client();
var moment = require('moment');
var guid = require('guid');

var showAsBusy = false;

var chelseaCalJSONUrl = 'https://www.kimonolabs.com/api/58lyzi04?apikey=pvbFO6LI5mcFCla6nTCZY1I05ljLAVRQ';
var icsFileName = "ChelseaCal.ics"



var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});


app.get('/', function(req, res) {
  res.send('<a href=/cal>Download Chelsea Calendar</a>');
});

app.get('/cal', function(req, res) {

  // Check how old the ics file is
  fs.stat(icsFileName, function(err, stats) {
    var fileModifiedTime = moment(stats.mtime);
    var diff = moment().diff(fileModifiedTime, 'days');

    // if older than a day
    if (diff > 0) {
      // Download JSON fixture data
      client.get(chelseaCalJSONUrl, function(data, response) {
        // parse JSON into ics format
        var icsFileData = json2ics(data);

        // write ics file
        fs.writeFile(icsFileName, icsFileData, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("The ics file was saved!");
          }
        }); //fs.writeFile ()
      }); //client.get()
    } // if
  }); // fs.stat



  var file = icsFileName;
  res.setHeader('Content-disposition', 'attachment; filename=' + file)
  res.setHeader('Content-Length', file.size)
  res.setHeader('Content-type', 'text/calendar')
  res.attachment(file);


}); // app.get()




function json2ics(data) {
  var icsString = '' +
    'BEGIN:VCALENDAR\r\n' +
    'PRODID:-//Sandalsoft Inc//Chelsea FC 2014-2015 Fixtures Calendar//EN\r\n' +
    'VERSION:2.0\r\n' +
    'CALSCALE:GREGORIAN\r\n' +
    'METHOD:PUBLISH\r\n' +
    'X-WR-CALNAME:ChelseaFC 14/15\r\n' +
    'X-WR-TIMEZONE:Europe/London\r\n';

  var json = JSON.parse(data)

  for (var i = json.results.collection1.length - 1; i >= 0; i--) {
    // for (var i = 2 - 1; i >= 0; i--) {

    var event = json.results.collection1[i];
    var DTSTART = getDTSTART(event);
    var DTEND = getDTEND(event);
    var DTSTAMP = getNow();
    var UID = getUID();
    var CREATED = getNow();
    var DESCRIPTION = getDescription(event);
    var LASTMODIFIED = getNow();
    var LOCATION = getLocation(event);
    var SEQUENCE = getSequence();
    var STATUS = 'CONFIRMED';
    var SUMMARY = getSummary(event);
    var TRANSP = getTransp();

    icsString = icsString +
      'BEGIN:VEVENT\r\n' +
      'DTSTART:' + DTSTART + '\r\n' +
      'DTEND:' + DTEND + '\r\n' +
      'DTSTAMP:' + DTSTAMP + '\r\n' +
      'UID:' + UID + '\r\n' +
      'CREATED:' + CREATED + '\r\n' +
      'DESCRIPTION:' + DESCRIPTION + '\r\n' +
      'LAST-MODIFIED:' + LASTMODIFIED + '\r\n' +
      'LOCATION:' + LOCATION + '\r\n' +
      'SEQUENCE:' + SEQUENCE + '\r\n' +
      'STATUS:' + STATUS + '\r\n' +
      'SUMMARY:' + SUMMARY + '\r\n' +
      'TRANSP:' + TRANSP + '\r\n' +
      'END:VEVENT\r\n';
  }

  icsString = icsString + '\n' +
    'END:VCALENDAR';
  return icsString;
}

function getTransp() {
  if (showAsBusy) {
    return 'OPAQUE';
  } else {
    return 'TRANSPARENT';
  }
}

function getSummary(event) {
  return getDescription(event);
}

function getSequence() {
  return 0;
}

function getNow() {
  return moment().format("YYYYMMDDTHHmmss") + "Z";
}

function getLocation(event) {
  return getTeamStadiumString(event.homeTeam.text);
}

function getDescription(event) {
  return event.awayTeam.text + ' at ' + event.homeTeam.text;
}

function getUID() {
  return guid.raw() + '@sandalsoft.com';
}

function getDTSTART(event) {
  var formattedDateString = getDateString(event)
  var startMoment = moment.utc(formattedDateString);
  var x = startMoment.format("YYYYMMDDTHHmmss");
  return startMoment.format("YYYYMMDDTHHmmss") + "Z"
}

function getDTEND(event) {
  var formattedDateString = getDateString(event)
  var startMoment = moment.utc(formattedDateString);
  var endMoment = moment(startMoment).add('h', 2);
  return endMoment.format("YYYYMMDDTHHmmss") + "Z";
}


function getDateString(event) {
  var dateField = event.date;
  var day = dateField.split(' ')[0];
  var dateRaw = dateField.split(' ')[1];
  var date = dateRaw < 10 ? '0' + dateRaw : dateRaw;
  var month = getMonthNumber(dateField.split(' ')[2]);
  var year = getYear(month);
  var hour = event.time.split(':')[0];
  var minute = event.time.split(':')[1];

  var dateString = year + '-' + month + '-' + date + 'T' + hour + ':' + minute + ':00.000Z';
  return dateString;
  // return year + month + date + 'T' + hour + minute + 'Z'; 
}

function getYear(month) {
  if (month > 7 && month < 13) {
    return '2014';
  } else {
    return '2015';
  }
}

function getMonthNumber(month) {
  switch (month) {
    case 'Aug':
      return '08';
      break;
    case 'Sep':
      return '09';
      break;
    case 'Oct':
      return '10';
      break;
    case 'Nov':
      return '11';
      break;
    case 'Dec':
      return '12';
      break;
    case 'Jan':
      return '01';
      break;
    case 'Feb':
      return '02';
      break;
    case 'Mar':
      return '03';
      break;
    case 'Apr':
      return '04';
      break;
    case 'May':
      return '05';
      break;
  }
}

function getTeamStadiumString(team) {
  switch (team) {
    case 'Chelsea':
      return 'Stamford Bridge - Fulham, London, SW6 1HS';
      break;

    case 'Burnley':
      return 'Turf Moor - Harry Potts Way, Burnley, Lancashire, England, BB10 4BX';
      break;

    case 'Leicester':
      return 'Filbert Street - Filbert Street, Leicester';
      break;

    case 'Everton':
      return 'Goodison Park - Goodison Road, Liverpool, England';
      break;

    case 'Swansea':
      return 'Liberty Stadium - Swansea, Wales';
      break;

    case 'Man City':
      return 'Etihad Stadium - Etihad Campus Manchester M11 3FF';
      break;

    case 'Aston Villa':
      return 'Villa Park - Trinity Road, Birmingham B6 6HE';
      break;

    case 'Arsenal':
      return 'Emirates Stadium - Hornsey Road London England';
      break;

    case 'Crystal Palace':
      return 'Selhurt Park - South Norwood, London';
      break;

    case 'Man Utd':
      return 'Old Trafford - Sir Matt Busby Way Old Trafford Trafford Greater Manchester England';
      break;

    case 'QPR':
      return 'Loftus Road - South Africa Road, Shepherd\'s Bush, London, W12 7PJ';
      break;

    case 'Liverpool':
      return 'Anfield - Liverpool, Merseyside, England';
      break;

    case 'West Brom':
      return 'The Hawthorns - West Bromwich, Sandwell, West Midlands';
      break;

    case 'Sunderland':
      return 'Roker Park - Sunderland, England';
      break;

    case 'Tottenham':
      return 'White Heart Lane - Bill Nicholson Way, 748 High Road, Tottenham, London, N17 0AP';
      break;

    case 'Newcastle':
      return 'St. James\' Park - St James\' Park, Newcastle upon Tyne NE1 4ST';
      break;

    case 'Hull':
      return 'KC Stadium - The Circle, Walton Street, Anlaby Road, Hull, England, HU3 6HU';
      break;

    case 'Stoke':
      return 'Britannia Stadium - Stanley Matthews Way Stoke-on-Trent England';
      break;

    case 'West Ham':
      return 'Upton Park - Green Street, Upton Park, London E13 9AZ';
      break;

    case 'Southampton':
      return 'The Dell - Milton Road, Southampton, England';
      break;

  }
}
