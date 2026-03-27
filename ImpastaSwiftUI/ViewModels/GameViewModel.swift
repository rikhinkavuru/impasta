import Foundation
import Combine

class GameViewModel: ObservableObject {
    @Published var game: Game?
    @Published var players: [Player] = []
    @Published var currentPlayer: Player?
    @Published var loading = false
    @Published var error: String?
    
    private let supabase = SupabaseService.shared
    private var cancellables = Set<AnyCancellable>()
    
    func createGame(hostName: String) async {
        loading = true
        error = nil
        do {
            let (game, player) = try await supabase.createGame(hostName: hostName)
            DispatchQueue.main.async {
                self.game = game
                self.currentPlayer = player
                self.players = [player]
                self.setupSubscriptions(gameId: game.id)
            }
        } catch {
            DispatchQueue.main.async {
                self.error = error.localizedDescription
            }
        }
        DispatchQueue.main.async {
            self.loading = false
        }
    }
    
    func joinGame(code: String, playerName: String) async {
        loading = true
        error = nil
        do {
            let (game, player) = try await supabase.joinGame(code: code, playerName: playerName)
            DispatchQueue.main.async {
                self.game = game
                self.currentPlayer = player
                self.setupSubscriptions(gameId: game.id)
                Task {
                    await self.fetchPlayers(gameId: game.id)
                }
            }
        } catch {
            DispatchQueue.main.async {
                self.error = error.localizedDescription
            }
        }
        DispatchQueue.main.async {
            self.loading = false
        }
    }
    
    private func fetchPlayers(gameId: UUID) async {
        do {
            let players = try await supabase.fetchPlayers(gameId: gameId)
            DispatchQueue.main.async {
                self.players = players
            }
        } catch {
            print("Error fetching players: \(error)")
        }
    }
    
    private func setupSubscriptions(gameId: UUID) {
        supabase.subscribeToGame(gameId: gameId) { [weak self] updatedGame in
            DispatchQueue.main.async {
                self?.game = updatedGame
            }
        }
        
        supabase.subscribeToPlayers(gameId: gameId) { [weak self] in
            Task {
                await self?.fetchPlayers(gameId: gameId)
            }
        }
    }
}
