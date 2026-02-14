# Auction System

## Catalogue Generation (generateAuctionCatalogue ~line 920)

8 horses per auction with shuffled quality distribution:
- 2 low, 3 medium, 2 high, 1 elite

## Bidding Process (simulateAuctionBidding ~line 1186)

### Opening Bid
```
currentBid = round(estimatedValue * (0.6 + random * 0.2) / 5000) * 5000
```
60-80% of estimated value, rounded to nearest 5,000.

### AI Bidders
- 1-3 AI bidders per lot (random)
- Each AI has a max bid:
```
aiMaxBid = round(estimatedValue * (0.8 + random * 0.4) / 5000) * 5000
```
80-120% of estimated value, rounded to nearest 5,000.

### Bidding Mechanics
- **Bid increment:** 5,000 per round
- **Interval:** 600ms per bid round
- **Max rounds:** 20 (hard cutoff)
- AI and player alternate bids
- AI drops out when current bid exceeds their max
- Player drops out when current bid exceeds their set max bid
- Gavel sound plays when bidding ends

### Purchase
- Won horses are added to `GameState.horses`
- Silk colours overridden to player's stable colours
- Cost deducted from budget

## Auction UI Flow

1. **Catalogue** - Browse 8 horses, see stats/preferences/guide price, set max bids
2. **Live Bidding** - Watch each lot auctioned in sequence with animated bid progression
3. **Results** - Summary of purchases, total spent, remaining budget
