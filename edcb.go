package main

import (
    "fmt"
    "net/http"
    "encoding/json"
    "io/ioutil"
    "database/sql"
    _ "github.com/mattn/go-sqlite3"
)

func main() {
    fmt.Println("Hello, EDCB")
    commodity := "Narcotics"
    system := "Vasukili"
    getClosestCommoditySystem(commodity, system)
}

func getClosestCommoditySystem(commodity string, system string) {
    s := fmt.Sprintf("Finding  closest system to %s which sells commodity: %s", system, commodity)
    fmt.Println(s);
    var systemExists bool
    var commodityExists bool
    // systemExists = checkSystemExists(system)
    commodityExists = checkCommodityExists(commodity)
    fmt.Println(fmt.Sprintf("System: %s exists: %t, Commodity: %s, Exists: %t", system, systemExists, commodity, commodityExists))
}

// Function to check whether a passed system exists
// TODO: It checks either a local cache followed by the Garud API
func checkSystemExists(system string) (bool) {
    fmt.Println("Checking if this system exists:", system)
    garudApiSystemsUrl := "http://elitebgs.kodeblox.com/api/eddb/v3/systems"
    systemRequestUrl := garudApiSystemsUrl + "?name=" + system
    fmt.Println("Requesting data from URL: ", systemRequestUrl)
    resp, err := http.Get(systemRequestUrl)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
    body, err := ioutil.ReadAll(resp.Body)
    var data map[string]interface{}
    err = json.Unmarshal([]byte(body), &data)
    if err != nil {
        panic(err)
    }
    return data["total"] != float64(0)
}

// Function to check whether the passed commodity name exists
// Currently iterates through commodities.json from eddb each and every time
// Reference: https://eddb.io/api
func checkCommodityExists(commodity string) (bool) {
    // commodityFilepath := "data/commodities.json"
    // raw, err := ioutil.ReadFile(commodityFilepath)
    // if err != nil {
    //     panic(err)
    // }
    // var data []map[string]interface{}
    // err = json.Unmarshal([]byte(raw), &data)
    // if err != nil {
    //     panic(err)
    // }
    // // Get only the commodity names from the commdity file
    // for _, v := range data {
    //     value, _ := v["name"].(string)
    //     fmt.Println(value)
    //     if commodity == value {
    //         comm_id, _ := v["id"].(int)
    //         if err != nil {
    //             panic(err)
    //         }
    //         return comm_id
    //     }
    // }
    // return 0
    db, err := sql.Open("sqlite3", "./data/eddb.db")
    if err != nil {
        panic(err)
    }
    defer db.Close()
    checkStatement := `SELECT COUNT(*) FROM commodities WHERE name == ?;`
    statement, err := db.Prepare(checkStatement)
    if err != nil {
        panic(err)
    }
    defer statement.Close()
    var amount int
    err = statement.QueryRow(commodity).Scan(&amount)
    fmt.Println(amount)
    commodityExists := amount > 0
    return commodityExists
}
