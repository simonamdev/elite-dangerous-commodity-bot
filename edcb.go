package main

import (
    "fmt"
    "github.com/purrcat259/elite-dangerous-commodity-bot/eddb"
    "github.com/purrcat259/elite-dangerous-commodity-bot/models"
    "time"
    "math"
    "encoding/json"
    "flag"
    "strings"
)

type Commodity struct {
    Id int `json:"id"`
    Name string `json:"name"`
    Exists bool `json:"exists"`
}

type Response struct {
    Commodity Commodity         `json:"commodity"`
    ReferenceSystem    models.StarSystem `json:"reference_system"`
    ClosestSystem    models.StarSystem `json:"closest_system"`
    Stations  []models.Station  `json:"stations"`
}

func main() {
    queryStart := time.Now().Unix()
    commodityName, systemName, verbose := parseArguments()
    commodityName = strings.Title(commodityName)
    systemName = strings.Title(systemName)
    closestSystem, relevantStations, commodity, referenceSystem := getClosestCommoditySystemAndStations(commodityName, systemName, verbose)
    // Place the answer in a struct
    answer := Response{commodity, referenceSystem, closestSystem, relevantStations}
    fmt.Println(len(relevantStations))
    // Serialise the struct to JSON for writing to stdout
    b, err := json.Marshal(answer)
    if err != nil {
        panic(err)
    }
    // fmt.Println("Answer: ", closestSystem, ", ", relevantStations)
    fmt.Println(string(b))
    queryFinish := time.Now().Unix()
    queryTime := queryFinish - queryStart
    if verbose {
        fmt.Println(fmt.Sprintf("Query took: %d seconds", queryTime))
    }
}

func parseArguments() (string, string, bool) {
    commodityName := flag.String("commodity", "", "The Commodity name")
    referenceSystemName := flag.String("system", "", "The reference System name")
    verbose := flag.Bool("verbose", false, "Print debug information to console")
    flag.Parse()
    return *commodityName, *referenceSystemName, *verbose
}

func getClosestCommoditySystemAndStations(commodity string, system string, verbose bool) (models.StarSystem, []models.Station, Commodity, models.StarSystem) {
    if verbose {
        fmt.Println(fmt.Sprintf("Finding closest system to %s which sells commodity: %s", system, commodity))
    }
    commodityId := getCommodityId(commodity)
    systemId := getSystemId(system)
    commodityExists := commodityId != 0
    systemExists := systemId != 0
    if verbose {
        fmt.Println(fmt.Sprintf("System: %s ID: %d, Commodity: %s, ID: %d", system, systemId, commodity, commodityId))
        fmt.Println(fmt.Sprintf("System: %s Exists: %t, Commodity: %s, Exists: %t", system, systemExists, commodity, commodityExists))
    }
    if !commodityExists {
        // TODO Respond
    } else if !systemExists {
        // TODO: Respond
    }
    // If both exist, get every station that sells the commodity
    // For each station, get the system IDs. Make sure to remove duplicates
    // For each system, calculate the distance (using X, Y and Z) and sort in order of closest
    referenceSystem := eddb.GetSystemDetails(systemId)
    closestSystem := findClosestStationSellingCommodity(commodityId, systemId)
    distanceToClosest := calculateEuclideanDistance(referenceSystem, closestSystem)

    relevantStations := eddb.GetStationsSellingCommodityInSystem(closestSystem.Id, commodityId)
    if verbose {
        fmt.Println(fmt.Sprintf("Closest System: %s, Distance: %.2fLy", closestSystem.Name, distanceToClosest))
        fmt.Println(relevantStations)
    }
    // Create the commodity
    comm := Commodity{commodityId, commodity, commodityExists}
    return closestSystem, relevantStations, comm, referenceSystem
}

func getCommodityId(commodity string) (int) {
    // fmt.Println("Retrieving commodity ID for:", commodity)
    commodityId := eddb.GetCommodityIdFromStorage(commodity)
    return commodityId
}

func getSystemId(system string) (int) {
    // fmt.Println("Retrieving system ID for:", system)
    systemId := eddb.GetSystemIdFromStorage(system)
    return systemId
}

func findClosestStationSellingCommodity(commodityId int, referenceSystemId int) (models.StarSystem) {
    systemsSellingCommodity := eddb.GetSystemsSellingCommodity(commodityId)
    // fmt.Println(fmt.Sprintf("%d Stations sell the required commodity", len(systemsSellingCommodity)))
    // fmt.Println("Calculating closest system")
    closestSystem := getClosestStarSystem(referenceSystemId, systemsSellingCommodity)
    return closestSystem
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
            closestDistance = distance
        }
    }
    return closestSystem
}

func calculateEuclideanDistance(a models.StarSystem, b models.StarSystem) float64 {
    return math.Sqrt(math.Pow(a.X - b.X, 2) + math.Pow(a.Y - b.Y, 2) + math.Pow(a.Z - b.Z, 2))
}
