import Foundation

enum GamePhase: String, Codable {
    case lobby
    case roleReveal = "role_reveal"
    case clueGiving = "clue_giving"
    case voting
    case results
}

struct Game: Identifiable, Codable {
    let id: UUID
    let code: String
    let hostPlayerId: UUID?
    var phase: GamePhase
    var word: String?
    var imposterClue: String?
    var currentTurnIndex: Int
    var difficulty: String
    var imposterMin: Int
    var imposterMax: Int
    var imposterRandom: Bool
    var clueRounds: Int
    
    enum CodingKeys: String, CodingKey {
        case id, code, phase, word, difficulty
        case hostPlayerId = "host_player_id"
        case imposterClue = "imposter_clue"
        case currentTurnIndex = "current_turn_index"
        case imposterMin = "imposter_min"
        case imposterMax = "imposter_max"
        case imposterRandom = "imposter_random"
        case clueRounds = "clue_rounds"
    }
}

struct Player: Identifiable, Codable {
    let id: UUID
    let gameId: UUID
    let name: String
    var isHost: Bool
    var isImposter: Bool
    var clue: String?
    var voteFor: String?
    var turnOrder: Int?
    var hasVoted: Bool
    
    enum CodingKeys: String, CodingKey {
        case id, name
        case gameId = "game_id"
        case isHost = "is_host"
        case isImposter = "is_imposter"
        case clue, voteFor = "vote_for"
        case turnOrder = "turn_order"
        case hasVoted = "has_voted"
    }
}

struct SessionScore: Identifiable, Codable {
    let id: UUID
    let playerId: UUID
    var score: Int
    var roundsWon: Int
    var correctVotes: Int
    
    enum CodingKeys: String, CodingKey {
        case id, score
        case playerId = "player_id"
        case roundsWon = "rounds_won"
        case correctVotes = "correct_votes"
    }
}
