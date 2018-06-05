package main

import "fmt"

func main() {
    fmt.Println("Hello, EDCB")
    getClosestCommoditySystem("Narcotics", "Brestla")
}

func getClosestCommoditySystem(commodity string, system string) {
    s := fmt.Sprintf("Finding  closest system to %s which sells commodity: %s", system, commodity)
    fmt.Println(s);
}
