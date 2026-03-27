import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = GameViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                if let game = viewModel.game, let currentPlayer = viewModel.currentPlayer {
                    switch game.phase {
                    case .lobby:
                        LobbyView(viewModel: viewModel)
                    case .roleReveal:
                        RoleRevealView(viewModel: viewModel)
                    case .clueGiving:
                        CluePhaseView(viewModel: viewModel)
                    case .voting:
                        VotingView(viewModel: viewModel)
                    case .results:
                        ResultsView(viewModel: viewModel)
                    }
                } else {
                    HomeView(viewModel: viewModel)
                }
            }
            .navigationTitle("Impasta")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct HomeView: View {
    @ObservedObject var viewModel: GameViewModel
    @State private var name = ""
    @State private var code = ""
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Welcome to Impasta")
                .font(.largeTitle)
                .bold()
            
            TextField("Enter your name", text: $name)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()
            
            Button(action: {
                Task {
                    await viewModel.createGame(hostName: name)
                }
            }) {
                Text("Create Game")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .disabled(name.isEmpty || viewModel.loading)
            
            Divider()
            
            TextField("Enter game code", text: $code)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()
            
            Button(action: {
                Task {
                    await viewModel.joinGame(code: code, playerName: name)
                }
            }) {
                Text("Join Game")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .disabled(name.isEmpty || code.isEmpty || viewModel.loading)
            
            if let error = viewModel.error {
                Text(error)
                    .foregroundColor(.red)
                    .padding()
            }
            
            if viewModel.loading {
                ProgressView()
            }
        }
        .padding()
    }
}

struct LobbyView: View {
    @ObservedObject var viewModel: GameViewModel
    
    var body: some View {
        VStack {
            Text("Game Code: \(viewModel.game?.code ?? "")")
                .font(.title)
                .bold()
            
            List(viewModel.players) { player in
                HStack {
                    Text(player.name)
                    if player.isHost {
                        Image(systemName: "crown.fill")
                            .foregroundColor(.yellow)
                    }
                }
            }
            
            if viewModel.currentPlayer?.isHost == true {
                Button(action: {
                    // Start game logic
                }) {
                    Text("Start Game")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .padding()
            } else {
                Text("Waiting for host to start...")
                    .italic()
                    .padding()
            }
        }
    }
}

struct RoleRevealView: View {
    @ObservedObject var viewModel: GameViewModel
    
    var body: some View {
        VStack {
            Text("Your Role")
                .font(.title)
            
            if viewModel.currentPlayer?.isImposter == true {
                Text("You are the IMPOSTER!")
                    .font(.largeTitle)
                    .foregroundColor(.red)
                    .bold()
                Text("Your clue: \(viewModel.game?.imposterClue ?? "")")
            } else {
                Text("You are a CIVILIAN")
                    .font(.largeTitle)
                    .foregroundColor(.blue)
                    .bold()
                Text("The word is: \(viewModel.game?.word ?? "")")
            }
            
            Button(action: {
                // Proceed to clues logic
            }) {
                Text("I'm Ready")
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .padding()
        }
    }
}

struct CluePhaseView: View {
    @ObservedObject var viewModel: GameViewModel
    
    var body: some View {
        Text("Clue Phase")
    }
}

struct VotingView: View {
    @ObservedObject var viewModel: GameViewModel
    
    var body: some View {
        Text("Voting Phase")
    }
}

struct ResultsView: View {
    @ObservedObject var viewModel: GameViewModel
    
    var body: some View {
        Text("Results Phase")
    }
}
