# Tennis Filtering in MMM-MyScoreboard

## Overview

The MMM-MyScoreboard module now includes enhanced filtering for tennis matches to automatically exclude doubles matches and show only singles matches. This filtering works at multiple levels to ensure comprehensive coverage.

## How It Works

### 1. Early Data Processing Filtering
The filtering begins at the data processing level in the ESPN provider (`providers/ESPN.js`). Before matches are even added to the events list, the system checks:

- **Competitor Count**: Only matches with exactly 2 competitors are included (singles matches have 2 players, doubles have 4)
- **Grouping Name**: Matches with grouping names containing "doubles" are excluded
- **Competition Type**: Matches with competition types containing "doubles" are excluded

### 2. Main Filtering Logic
Additional filtering occurs in the main `formatScores` function:

- **Athlete Data Verification**: Ensures both competitors have individual athlete data (not team data)
- **Competition Type Check**: Double-checks competition type for doubles indicators
- **Grouping Check**: Double-checks grouping information for doubles indicators

### 3. Configuration Options

#### Basic Configuration
```javascript
{
  league: 'TENNIS',
  teams: [], // Empty array means show all singles matches
}
```

#### Advanced Configuration with Groupings
```javascript
{
  league: 'TENNIS',
  teams: [], // Empty array means show all singles matches
  groupings: ['mens-singles', 'womens-singles'], // Optional: filter by specific tournament groupings
}
```

#### Player-Specific Filtering
```javascript
{
  league: 'TENNIS',
  teams: ['Novak Djokovic', 'Rafael Nadal'], // Show only matches with these players
}
```

#### Ranking-Based Filtering
```javascript
{
  league: 'TENNIS',
  teams: ['@T10'], // Show only matches with players ranked in top 10
}
```

## Debugging

### Enable Debug Logging
To see what matches are being filtered out, enable debug logging in your MagicMirror configuration:

```javascript
{
  module: 'MMM-MyScoreboard',
  config: {
    // ... your config
  },
  debug: true
}
```

### Debug Messages
The module will log debug messages when filtering out matches:
- `Skipping tennis match [ID]: [X] competitors (not singles)`
- `Skipping tennis match [ID]: grouping indicates doubles`
- `Skipping tennis match [ID]: competition type indicates doubles`
- `Filtering out tennis match [ID]: missing athlete data`

### Test Script
Use the included test script to verify filtering:

```bash
cd MMM-MyScoreboard
node test-tennis-filtering.js
```

This script will show you:
- Total matches found
- Which matches are singles vs doubles
- Why specific matches are being filtered out
- Summary counts

## Filtering Criteria

### Matches That Are Excluded (Doubles)
- Matches with 4 competitors (2 teams of 2 players each)
- Matches where grouping name contains "doubles"
- Matches where competition type contains "doubles"
- Matches missing individual athlete data

### Matches That Are Included (Singles)
- Matches with exactly 2 competitors (individual players)
- Matches where both competitors have athlete data
- Matches where grouping and competition type don't indicate doubles

## Troubleshooting

### If You're Still Seeing Doubles Matches

1. **Check Debug Logs**: Enable debug logging to see what's happening
2. **Verify Data Structure**: The filtering relies on ESPN's data structure - if it changes, filtering may need updates
3. **Check Configuration**: Ensure your tennis configuration is correct
4. **Run Test Script**: Use the test script to see raw data and filtering results

### If You Want to See Doubles Matches

Currently, the module is designed to show only singles matches. If you want to see doubles matches, you would need to modify the filtering logic in `providers/ESPN.js`.

## Technical Details

### Data Structure
Tennis data from ESPN comes in a nested structure:
```
events[0].groupings[0].competitions[0].competitors[]
```

The module converts this to a flat structure for easier processing:
```
events[0].competitions[0].competitors[]
```

### Filtering Points
1. **Data Processing Level** (`getScores` function): Early filtering during data conversion
2. **Main Filtering Level** (`formatScores` function): Comprehensive filtering before display
3. **Configuration Level**: User-defined filters for specific players, rankings, or groupings

### Performance
The filtering is designed to be efficient by:
- Filtering early in the data processing pipeline
- Using simple string checks for doubles detection
- Avoiding unnecessary processing of excluded matches
