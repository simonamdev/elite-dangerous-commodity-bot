package main

import (
    "fmt"
    "net/http"
    "encoding/json"
    "io/ioutil"
)

func main() {
    fmt.Println("Hello, EDCB")
    commodity := "Narcotics"
    system := "blalbalb"
    getClosestCommoditySystem(commodity, system)
}

func getClosestCommoditySystem(commodity string, system string) {
    s := fmt.Sprintf("Finding  closest system to %s which sells commodity: %s", system, commodity)
    fmt.Println(s);
    fmt.Println("Checking if this system exists:", system)
    fmt.Println(checkSystemExists(system));
}

// Function to check whether a passed system exists
// TODO: It checks either a local cache followed by the Garud API
func checkSystemExists(system string) (bool) {
    garudApiSystemsUrl := "http://elitebgs.kodeblox.com/api/eddb/v3/systems"
    systemRequestUrl := garudApiSystemsUrl + "?name=" + system
    fmt.Println("Requesting data from URL: ", systemRequestUrl)
    resp, err := http.Get(systemRequestUrl)
    if err != nil {
        fmt.Println(err)
    }
    defer resp.Body.Close()
    body, err := ioutil.ReadAll(resp.Body)
    var data map[string]interface{}
    erro := json.Unmarshal([]byte(body), &data)
    if erro != nil {
        panic(erro)
    }
    return data["total"] != float64(0)
}
