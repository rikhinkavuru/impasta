import Foundation
import Supabase

class SupabaseService {
    static let shared = SupabaseService()
    
    // Replace with your actual Supabase URL and Key
    private let supabaseURL = URL(string: "https://your-project-url.supabase.co")!
    private let supabaseKey = "your-anon-key"
    
    let client: SupabaseClient
    
    private init() {
        self.client = SupabaseClient(supabaseURL: supabaseURL, supabaseKey: supabaseKey)
    }
    
    func createGame(hostName: String) async throws -> (Game, Player) {
        let code = String((0..<5).map { _ in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".randomElement()! })
        
        let game: Game = try await client.database
            .from("games")
            .insert(["code": code, "phase": "lobby"])
            .select()
            .single()
            .execute()
            .value
        
        let player: Player = try await client.database
            .from("players")
            .insert(["game_id": game.id, "name": hostName, "is_host": true])
            .select()
            .single()
            .execute()
            .value
        
        try await client.database
            .from("games")
            .update(["host_player_id": player.id])
            .eq("id", value: game.id)
            .execute()
        
        return (game, player)
    }
    
    func joinGame(code: String, playerName: String) async throws -> (Game, Player) {
        let game: Game = try await client.database
            .from("games")
            .select()
            .eq("code", value: code.uppercased())
            .single()
            .execute()
            .value
        
        guard game.phase == .lobby else {
            throw NSError(domain: "Game already in progress", code: 400)
        }
        
        let player: Player = try await client.database
            .from("players")
            .insert(["game_id": game.id, "name": playerName])
            .select()
            .single()
            .execute()
            .value
        
        return (game, player)
    }
    
    func fetchPlayers(gameId: UUID) async throws -> [Player] {
        return try await client.database
            .from("players")
            .select()
            .eq("game_id", value: gameId)
            .order("turn_order", ascending: true)
            .execute()
            .value
    }
    
    func subscribeToGame(gameId: UUID, onUpdate: @escaping (Game) -> Void) {
        client.realtime
            .channel("game-\(gameId)")
            .on("postgres_changes", filter: .init(schema: "public", table: "games", filter: "id=eq.\(gameId)")) { message in
                if let game: Game = try? message.decode() {
                    onUpdate(game)
                }
            }
            .subscribe()
    }
    
    func subscribeToPlayers(gameId: UUID, onUpdate: @escaping () -> Void) {
        client.realtime
            .channel("players-\(gameId)")
            .on("postgres_changes", filter: .init(schema: "public", table: "players", filter: "game_id=eq.\(gameId)")) { _ in
                onUpdate()
            }
            .subscribe()
    }
}
