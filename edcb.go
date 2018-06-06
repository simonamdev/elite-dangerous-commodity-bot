package main

import (
    "fmt"
    "github.com/purrcat259/elite-dangerous-commodity-bot/eddb"
    "github.com/purrcat259/elite-dangerous-commodity-bot/models"
    "time"
    "math"
)



func main() {
    fmt.Println("Hello, EDCB")
    commodity := "Coffee"
    system := "Brestla"
    getClosestCommoditySystem(commodity, system)
}

func getClosestCommoditySystem(commodity string, system string) {
    s := fmt.Sprintf("Finding closest system to %s which sells commodity: %s", system, commodity)
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

func findClosestStationSellingCommodity(commodityId int, referenceSystemId int) {
    queryStart := time.Now().Unix()

    referenceSystem := eddb.GetSystemDetails(referenceSystemId)

    systemsSellingCommodity := eddb.GetSystemsSellingCommodity(commodityId)
    fmt.Println(fmt.Sprintf("%d Stations sell the required commodity", len(systemsSellingCommodity)))

    fmt.Println("Calculating closest system")
    closestSystem := getClosestStarSystem(referenceSystemId, systemsSellingCommodity)
    fmt.Println(closestSystem)

    fmt.Println("Distance to closest system: ", calculateEuclideanDistance(referenceSystem, closestSystem))

    queryFinish := time.Now().Unix()
    queryTime := queryFinish - queryStart
    fmt.Println(fmt.Sprintf("Query took: %d seconds", queryTime))
}

func getSystemIdsOfStations(stationIds []int) []int {
    systemIds := eddb.ConvertStationIdsToSystemIds(stationIds)
    return systemIds
}

func getClosestStarSystem(currentSystemId int, systemIds []int) models.StarSystem {
    closestDistance := math.MaxFloat64
    currentSystem := eddb.GetSystemDetails(currentSystemId)
    // fmt.Println(currentSystem)
    var closestSystem models.StarSystem
    for i := 0; i < len(systemIds); i++ {
        starSystem := eddb.GetSystemDetails(systemIds[i])
        distance := calculateEuclideanDistance(currentSystem, starSystem)
        // fmt.Println(systemIds[i])
        // fmt.Println(starSystem.Name)
        // fmt.Println(distance)
        if distance < closestDistance {
            closestSystem = starSystem
        }
    }
    return closestSystem
}

func calculateEuclideanDistance(a models.StarSystem, b models.StarSystem) float64 {
    return math.Sqrt(math.Pow(a.X - b.X, 2) + math.Pow(a.Y - b.Y, 2) + math.Pow(a.Z - b.Z, 2))
}
