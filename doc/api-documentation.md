# Name Generation API Documentation

This API provides endpoints for retrieving lists of first names, last names, and combined full names, sourced from US Census and Social Security data.  It supports filtering by various criteria, including frequency, race, gender, year of popularity, and starting characters.

**Base URL:**  `[Your Server Address]:[PORT]` (e.g., `localhost:3001`)

**General Notes:**

*   All endpoints return JSON data.
*   Error responses will have a 4xx or 5xx HTTP status code and a JSON body containing an `errors` array.  Each error object in the array will have a `code` and a `message`.
* String parameters are case-insensitive.
* All parameters are optional and can be used in combination.

## Endpoints

### 1. `/api/surnames` - Get Surnames (Last Names)

Retrieves a list of surnames.

**Query Parameters:**

*   `limit`: (Integer, default: 10, max: 100) The maximum number of surnames to return.  If the limit is over 100, the API returns a 400 error with code 0: "Invalid limit specified".
*   `frequency`: (String, default: "any") Filters surnames by their frequency.  Valid values:
    *   `"any"`:  No frequency filtering.
    *   `"low"`:  Surnames with a frequency less than 0.1.
    *   `"medium"`: Surnames with a frequency greater than or equal to 0.06 and less than 1.
    *   `"high"`: Surnames with a frequency greater than or equal to 1.
    If an invalid frequency is used the API returns a 400 error with code 6: "Invalid frequency specified".
*   `race`: (String, repeated, *must be used in pairs*) Filters surnames by racial demographics. Takes two parameters:  a race code and a minimum percentage.
    *   Valid race codes (must be paired with a percentage value):
        *   `"pctwhite"`
        *   `"pctblack"`
        *   `"pctasian"`
        *   `"pctnative"`
        *   `"pcthispanic"`
    *   Percentage value (Integer, 0-99): The minimum percentage of the specified race associated with the surname.
        Example: `?race=pctblack&race=50` (returns surnames where the percentage of Black individuals with that surname is greater than 50). If an invalid race is used the API returns a 400 error with code 4: "Invalid race specified". If the percent is invalid, the API returns error code 5: "Invalid race percent specified"
*   `sstartswith`: (String) Filters surnames based on their starting characters.
    *   If a single letter or a sequence of letters is provided (e.g., "j" or "ka"), it returns surnames starting with that sequence (case-insensitive).
    *   If a letter or sequence is followed by an asterisk (`*`), it returns surnames that *do not* start with that sequence. Multiple exclusions can be specified by separating them with commas (e.g., `sstartswith=c*,p*,s*`).
    *   If a letter sequence is followed by a caret (`^`), it will return only names that are an exact match to the sequence.
    *   If an invalid character is provided, the API returns a 400 error with code 7: "Invalid startswith specified"

**Response Body:**

```json
{
  "surnames": [
    {
      "name": "SMITH",
      "frequency": 2.5,
      "pctwhite": 70.7,
      "pctblack": 23.1,
      "pctasian": 0.5,
      "pctnative": 0.9,
      "pcthispanic": 2.4
    },
    ...
  ]
}
```

**Example Requests:**

*   `/api/surnames` (10 random surnames)
*   `/api/surnames?limit=25` (25 random surnames)
*   `/api/surnames?frequency=high` (10 high-frequency surnames)
*   `/api/surnames?race=pctwhite&race=80` (surnames that are at least 80% white)
*   `/api/surnames?sstartswith=mc` (surnames starting with "mc")
*   `/api/surnames?sstartswith=a*,b*` (surnames *not* starting with "a" or "b")
*   `/api/surnames?sstartswith=gonzalez^` (Only the surname "Gonzalez")

### 2. `/api/firstnames` - Get First Names

Retrieves a list of first names.

**Query Parameters:**

*   `limit`: (Integer, default: 10) The maximum number of first names to return.  If the limit is less than 0, the API returns a 400 error with code 0: "Invalid limit specified".
*   `year`: (Integer, default: "any") The year of popularity for the first names.  If not specified, names from all years are returned. If an invalid year is provided, the API returns a 400 error with code 1: "Invalid year specified".
*   `gender`: (String, default: "any") Filters first names by gender. Valid values:
    *   `"any"`:  Returns both male and female names.
    *   `"male"`: Returns only male names.
    *   `"female"`: Returns only female names.
        If an invalid gender is provided the API returns a 400 error with code 2: "Invalid gender specified".
*   `rank`: (String, default: "any")  Filters first names by their rank within the specified year.  Valid values:
    *   `"any"`: No rank filtering.
    *   `"high"`:  Returns names from the top portion of the rankings.
    *   `"low"`: Returns names from the lower portion of the rankings.

        The cutoff between "high" and "low" depends on the `year` parameter. These are set dynamically as follows:
          If the year is greater than 500, high is less than 301, low is greater than 300.
          If the year is less than or equal to 500, high is less than 126, low is greater than 125.
          If the year is zero, high is less than 801, low is greater than 800.
    If an invalid rank is sent, the API returns a 400 error with code 3: "Invalid rank specified".

*   `fstartswith`: (String) Filters first names based on their starting characters.  This follows the same rules as `sstartswith` for surnames (see above), including case-insensitivity, exclusion using `*`, and exact match using `^`.

**Response Body:**

```json
{
  "firstnames": [
    {
      "name": "MARY",
      "gender": "F",
      "year": 1950,
      "rank": 1
    },
    ...
  ]
}
```

**Example Requests:**

*   `/api/firstnames` (10 random first names)
*   `/api/firstnames?limit=5&year=2000` (5 first names from the year 2000)
*   `/api/firstnames?gender=male&rank=high` (10 high-ranked male first names)
*   `/api/firstnames?fstartswith=al` (first names starting with "al")
*  `/api/firstnames?fstartswith=j*,m*` (first names *not* starting with 'j' or 'm')

### 3. `/api/names` - Get Combined First and Last Names

Retrieves a list of combined first and last names.

**Query Parameters:**

*   All parameters from `/api/firstnames` and `/api/surnames` are supported.  The filtering applies independently to the first and last name selection. 
* If the API is unable to find enough combinations based on the parameters, a `warnings` key will be returned with notes.

**Response Body:**

```json
{
  "names": [
    {
      "firstname": {
        "name": "JAMES",
        "gender": "M",
        "year": 1980,
        "rank": 3
      },
      "lastname": {
        "name": "JOHNSON",
        "frequency": 1.8,
        "pctwhite": 58.9,
        "pctblack": 37.7,
        "pctasian": 0.3,
        "pctnative": 0.7,
        "pcthispanic": 1.3
      }
    },
    ...
  ],
    "warnings": []
}
```

**Example Requests:**

*   `/api/names` (Combines 10 first names and 10 surnames with default settings)
*   `/api/names?year=1990&gender=female&race=pctasian&race=60` (Combines female first names popular in 1990 with surnames that are at least 60% Asian)
* /api/names?fstartswith=ro&sstartswith=sm (Names with first name starts with "ro" and surname starts with "sm")

This documentation provides a clear, concise, and complete guide to using the Name Generation API, covering all endpoints, parameters, response formats, and error handling, as derived from the provided test file. It's ready to be used by developers to integrate with the API.
