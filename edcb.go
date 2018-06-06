package main

import (
    "fmt"
    "github.com/purrcat259/elite-dangerous-commodity-bot/eddb"
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
    commodityId := getCommodityId(commodity)
    systemId := getSystemId(system)
    fmt.Println(fmt.Sprintf("System: %s ID: %d, Commodity: %s, ID: %d", system, systemId, commodity, commodityId))
    commodityExists := commodityId != 0
    systemExists := systemId != 0
    fmt.Println(fmt.Sprintf("System: %s Exists: %t, Commodity: %s, Exists: %t", system, systemExists, commodity, commodityExists))
    if !commodityExists {
        // TODO: Respond
    } else if !systemExists {
        // TODO: Respond
    }
    // If both exist, get every station that sells the commodity
    // For each station, get the system IDs. Make sure to remove duplicates
    // For each system, calculate the distance (using X, Y and Z) and sort in order of closest
    findClosestStationSellingCommodity(commodityId, systemId)
}

func getCommodityId(commodity string) (int) {
    fmt.Println("Retrieving commodity ID for:", commodity)
    commodityId := eddb.GetCommodityIdFromStorage(commodity)
    return commodityId
}

func getSystemId(system string) (int) {
    fmt.Println("Retrieving system ID for:", system)
    systemId := eddb.GetSystemIdFromStorage(system)
    return systemId
}

func findClosestStationSellingCommodity(commodityId int, systemId int) {
    stationsSellingCommodity := eddb.GetStationsSellingCommodityFromStorage(commodityId)
    fmt.Println(stationsSellingCommodity)
}
