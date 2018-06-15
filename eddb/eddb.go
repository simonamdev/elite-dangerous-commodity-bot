package eddb

import (
    "fmt"
    "path/filepath"
    "github.com/purrcat259/elite-dangerous-commodity-bot/models"
    "database/sql"
    _ "github.com/mattn/go-sqlite3"
)

func getDbConnection() (*sql.DB) {
    dbPath, err := filepath.Abs("./data/eddb.db")
    // fmt.Println("Accessing Database at:", dbPath)
    db, err := sql.Open("sqlite3", dbPath)
    if err != nil {
        panic(err)
    }
    return db
}

func GetCommodityIdFromStorage(commodity string) (int) {
    db := getDbConnection()
    defer db.Close()
    checkStatement := `SELECT commodityId FROM commodities WHERE name == ?;`
    statement, err := db.Prepare(checkStatement)
    if err != nil {
        panic(err)
    }
    defer statement.Close()
    var commodityId int
    err = statement.QueryRow(commodity).Scan(&commodityId)
    return commodityId
}

func GetSystemIdFromStorage(system string) (int) {
    db := getDbConnection()
    defer db.Close()
    checkStatement := `SELECT systemId FROM populatedSystems WHERE name == ?;`
    statement, err := db.Prepare(checkStatement)
    if err != nil {
        panic(err)
    }
    defer statement.Close()
    var systemId int
    err = statement.QueryRow(system).Scan(&systemId)
    return systemId
}

func GetStationsInSystem(systemId int) []models.Station {
    db := getDbConnection()
    defer db.Close()
    checkStatement := `SELECT stationId, name systemId, distanceToStar, maxLandingPad FROM stations WHERE systemId == %d;`
    rows, err := db.Query(fmt.Sprintf(checkStatement, systemId))
    if err != nil {
        panic(err)
    }
    defer rows.Close()
    stations := make([]models.Station, 0)
    for rows.Next() {
        var station models.Station
        err = rows.Scan(&station.Id, &station.Name, &station.SystemId, &station.DistanceToStar, &station.MaxLandingPad)
        if err != nil {
            panic(err)
        }
        // fmt.Println(station)
        stations = append(stations, station)
    }
    return stations
}

func GetStationsSellingCommodityInSystem(systemId int, commodityId int) ([]models.Station) {
    db := getDbConnection()
    defer db.Close()
    queryStatement := `SELECT stations.stationId, stations.name, stations.systemId, stations.distanceToStar, stations.maxLandingPad FROM listings INNER JOIN stations ON stations.stationId == listings.stationId WHERE commodityId == %d AND stations.systemId == %d;`
    // Not ideal, but there does not seem to be a way to prepare a statement without providing the number of rows
    // you will receive
    rows, err := db.Query(fmt.Sprintf(queryStatement, commodityId, systemId))
    if err != nil {
        panic(err)
    }
    defer rows.Close()
    var stations []models.Station
    for rows.Next() {
        var station models.Station
        err = rows.Scan(&station.Id, &station.Name, &station.SystemId, &station.DistanceToStar, &station.MaxLandingPad)
        if err != nil {
            panic(err)
        }
        stations = append(stations, station)
        // fmt.Println(station)
    }
    return stations
}

func ConvertStationIdsToSystemIds(stationIds []int) []int {
    db := getDbConnection()
    defer db.Close()
    queryStatement := `SELECT stationId FROM listings WHERE commodityId == %d;`
    // Not ideal, but there does not seem to be a way to prepare a statement without providing the number of rows
    // you will receive
    var systemIds []int
    for i := 0; i < len(stationIds); i++ {
        rows, err := db.Query(fmt.Sprintf(queryStatement, stationIds[i]))
        if err != nil {
            panic(err)
        }
        for rows.Next() {
            var systemId int
            err = rows.Scan(&systemId)
            if err != nil {
                panic(err)
            }
            if !valueInArray(systemId, systemIds) {
                systemIds = append(systemIds, systemId)
            }
        }
    }
    return systemIds
}

func valueInArray(val int, arr []int) bool {
    for i := 0; i < len(arr); i++ {
        if val == arr[i] {
            return true
        }
    }
    return false
 }

func GetSystemDetails(systemId int) models.StarSystem {
    db := getDbConnection()
    defer db.Close()
    queryStatement := `SELECT systemId, name, x, y, z FROM populatedSystems WHERE systemId == ?;`
    statement, err := db.Prepare(queryStatement)
    if err != nil {
        panic(err)
    }
    defer statement.Close()
    var starSystemDetails models.StarSystem
    err = statement.QueryRow(systemId).Scan(&starSystemDetails.Id, &starSystemDetails.Name, &starSystemDetails.X, &starSystemDetails.Y, &starSystemDetails.Z)
    return starSystemDetails
}

func GetSystemsSellingCommodity(commodityId int) ([]int) {
    db := getDbConnection()
    defer db.Close()
    // Not ideal, but there does not seem to be a way to prepare a statement without providing the number of rows
    // you will receive
    queryStatement := `SELECT populatedSystems.systemId FROM populatedSystems INNER JOIN  stations ON populatedSystems.systemId == stations.systemId INNER JOIN listings on listings.stationId == stations.stationId WHERE listings.commodityId = %d AND stations.hasDocking = 1;`
    systemIds := make([]int, 0)
    rows, err := db.Query(fmt.Sprintf(queryStatement, commodityId))
    if err != nil {
        panic(err)
    }
    defer rows.Close()
    for rows.Next() {
        var systemId int
        err = rows.Scan(&systemId)
        if err != nil {
            panic(err)
        }
        if !valueInArray(systemId, systemIds) {
            systemIds = append(systemIds, systemId)
        }
    }
    return systemIds
}
