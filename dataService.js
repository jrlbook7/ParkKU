const LOTS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7q-Yb6D3ukvsKLUo77rmSvXooannHdDYTtQUSg0m5gu9TpJbh0JDQ5JAUGpodjepMwW5QUrjouQN-/pub?gid=0&single=true&output=csv'
const SCHEDULE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7q-Yb6D3ukvsKLUo77rmSvXooannHdDYTtQUSg0m5gu9TpJbh0JDQ5JAUGpodjepMwW5QUrjouQN-/pub?gid=98947031&single=true&output=csv'
const OVERRIDE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7q-Yb6D3ukvsKLUo77rmSvXooannHdDYTtQUSg0m5gu9TpJbh0JDQ5JAUGpodjepMwW5QUrjouQN-/pub?gid=738699188&single=true&output=csv'
const CALENDAR = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7q-Yb6D3ukvsKLUo77rmSvXooannHdDYTtQUSg0m5gu9TpJbh0JDQ5JAUGpodjepMwW5QUrjouQN-/pub?gid=87634798&single=true&output=csv'


//fetch entire file
async function fetchCSV(url) {
    const response = await fetch(url);
    const csv = await response.text();
    return parseCSV(csv);
}

//parse the entire file, creates readable values
export async function fetchParkingData(){
    const [lotRows, scheduleRows, overrideRows, calendarRows] = await Promise.all([
        fetchCSV(LOTS),
        fetchCSV(SCHEDULE),
        fetchCSV(OVERRIDE),
        fetchCSV(CALENDAR)
    ]);

    //parse rows
    function parseCSV(string){
        //separate into lines and header
        const lines = string.split("\n");
        const header = lines.shift();
        const headerData = header.split(",");


        //divide each line and create new array with matched values
        const result = lines.map(line => {
            const values = line.split(",");
            const row = {};
            headerData.forEach((item,index) => row[item] = values[index]); //create a dictionary-like item that assigns each column a value
            return row;
        });
        return result; 
    }

    //parse tabs
    function parseCalendar(rows){
        return rows;
    }

    function parseLots(rows){
        //create new array from raw rows to fit json format; empty string set to null; split permit types at semicolon
        return rows.map(row => {
            let keys = Object.keys(row);

            for (let i=0;i<keys.length;i++){
                if (row[keys[i]] === "") row[keys[i]] = null;
            }
            return row;
            
            row["permit_types"] = row["permit_types"].split(";");
        });
    }

    function parseSchedule(rows){
        const schedule = {};
        rows.forEach(row => {
            //If lot has not yet been added, initialize it 
            if (schedule[row["id"]] === undefined) {
                schedule[row["id"]] = {};
            }

            //add weekend and weekday rules to the object of the lot
            if (row["day_type"] === "weekend"){
                schedule[row["id"]]["weekend"] = {student_access: row["student_access"] === "true"};
            } else {
                const weekdayRules = [];
                if (row["free_access_after"] !== ("")) weekdayRules.push({free_access_after: row["free_access_after"]});
                if (row["permit_parking"] !== ("")) weekdayRules.push({permit_parking: row["permit_parking"]});

                schedule[row["id"]]["monday-friday"]= weekdayRules;
            }
        });
        return schedule;
    }
}