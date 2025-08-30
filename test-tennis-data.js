#!/usr/bin/env node

const fetch = require('node-fetch');
const moment = require('moment-timezone');

// Configuration similar to MMM-MyScoreboard
const config = {
  timeFormat: 12,
  rolloverHours: 3,
  debugHours: 0,
  debugMinutes: 0
};

// Get today's date with debug adjustments
const gameDate = moment().add(config.debugHours, 'hours').add(config.debugMinutes, 'minutes');
const formattedDate = gameDate.format('YYYYMMDD');
const displayDate = gameDate.format('YYYY-MM-DD');

console.log('=== Tennis Data Test Script ===');
console.log(`Current time: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
console.log(`Game date: ${displayDate} (${formattedDate})`);
console.log(`Rollover hours: ${config.rolloverHours}`);
console.log('');

async function testTennisData() {
  try {
    // Build the same URL that MMM-MyScoreboard uses
    const url = `https://site.api.espn.com/apis/site/v2/sports/tennis/all/scoreboard?dates=${formattedDate}&limit=200`;
    
    console.log(`Fetching data from: ${url}`);
    console.log('');
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.events || data.events.length === 0) {
      console.log('No events found for today.');
      return;
    }
    
    console.log(`Found ${data.events.length} total events`);
    console.log('');
    
    // Filter events for today's date
    const todayEvents = data.events.filter(event => {
      const eventDate = moment.tz(event.date, 'America/New_York').format('YYYYMMDD');
      return eventDate === formattedDate;
    });
    
    console.log(`Events matching today's date (${formattedDate}): ${todayEvents.length}`);
    console.log('');
    
    // Process tennis matches
    const tennisMatches = [];
    
    todayEvents.forEach(event => {
      if (event.groupings && event.groupings.length > 0) {
        event.groupings.forEach(grouping => {
          if (grouping.competitions && grouping.competitions.length > 0) {
            grouping.competitions.forEach(competition => {
              // Skip doubles matches
              if (competition.competitors && competition.competitors.length !== 2) {
                return;
              }
              
              // Skip if grouping name indicates doubles
              if (grouping.grouping && grouping.grouping.name && 
                  grouping.grouping.name.toLowerCase().includes('doubles')) {
                return;
              }
              
              // Skip if competition type indicates doubles
              if (competition.type && 
                  (competition.type.name && competition.type.name.toLowerCase().includes('doubles')) ||
                  (competition.type.abbreviation && competition.type.abbreviation.toLowerCase().includes('doubles'))) {
                return;
              }
              
              // Extract player data
              let hTeamData = competition.competitors[0];
              let vTeamData = competition.competitors[1];
              
              if (hTeamData.homeAway === 'away') {
                [hTeamData, vTeamData] = [vTeamData, hTeamData];
              }
              
              const match = {
                id: competition.id,
                date: event.date,
                eventName: event.name,
                grouping: grouping.grouping ? grouping.grouping.name : 'Unknown',
                status: competition.status.type.name,
                statusId: competition.status.type.id,
                hPlayer: hTeamData.athlete ? hTeamData.athlete.displayName : 'TBD',
                vPlayer: vTeamData.athlete ? vTeamData.athlete.displayName : 'TBD',
                hScore: hTeamData.score || '',
                vScore: vTeamData.score || '',
                hLinescores: hTeamData.linescores || [],
                vLinescores: vTeamData.linescores || [],
                winner: hTeamData.winner || vTeamData.winner,
                hasTBD: false
              };
              
              // Check for TBD opponents
              if (hTeamData.athlete === null || vTeamData.athlete === null ||
                  hTeamData.athlete === undefined || vTeamData.athlete === undefined ||
                  hTeamData.athlete.displayName === 'TBD' || vTeamData.athlete.displayName === 'TBD') {
                match.hasTBD = true;
              }
              
              tennisMatches.push(match);
            });
          }
        });
      }
    });
    
    console.log(`Found ${tennisMatches.length} singles matches`);
    console.log('');
    
    // Group by tournament
    const tournaments = {};
    tennisMatches.forEach(match => {
      if (!tournaments[match.eventName]) {
        tournaments[match.eventName] = [];
      }
      tournaments[match.eventName].push(match);
    });
    
    // Display results
    Object.keys(tournaments).forEach(tournament => {
      console.log(`\n=== ${tournament} ===`);
      const matches = tournaments[tournament];
      
      matches.forEach(match => {
        const status = match.statusId === '0' ? 'TBD' : match.status;
        const score = match.hScore && match.vScore ? `${match.hScore}-${match.vScore}` : 'No Score';
        const tbdFlag = match.hasTBD ? ' [TBD OPPONENT]' : '';
        
        console.log(`${match.vPlayer} vs ${match.hPlayer} - ${score} (${status})${tbdFlag}`);
      });
    });
    
    // Summary
    console.log('\n=== SUMMARY ===');
    const tbdMatches = tennisMatches.filter(match => match.hasTBD);
    console.log(`Total matches: ${tennisMatches.length}`);
    console.log(`Matches with TBD opponents: ${tbdMatches.length}`);
    
    if (tbdMatches.length > 0) {
      console.log('\nTBD Matches:');
      tbdMatches.forEach(match => {
        console.log(`- ${match.vPlayer} vs ${match.hPlayer} (${match.eventName})`);
      });
    }
    
    // Check for date anomalies
    console.log('\n=== DATE ANALYSIS ===');
    const eventDates = [...new Set(data.events.map(event => 
      moment.tz(event.date, 'America/New_York').format('YYYY-MM-DD')
    ))];
    
    console.log('Dates found in API response:');
    eventDates.forEach(date => {
      const count = data.events.filter(event => 
        moment.tz(event.date, 'America/New_York').format('YYYY-MM-DD') === date
      ).length;
      console.log(`- ${date}: ${count} events`);
    });
    
  } catch (error) {
    console.error('Error fetching tennis data:', error);
  }
}

// Run the test
testTennisData();
