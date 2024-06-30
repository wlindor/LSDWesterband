package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "math/rand"
    "net/http"
    "os"
    "time"

    openai "github.com/sashabaranov/go-openai"
    "github.com/joho/godotenv"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

var client *mongo.Client
var openaiClient *openai.Client

type Case struct {
    CaseID       string    `json:"case_id" bson:"case_id"`
    CaseName     string    `json:"case_name" bson:"case_name"`
    CaseFacts    string    `json:"case_facts" bson:"case_facts"`
    DateCreated  time.Time `json:"date_created" bson:"date_created"`
    CaseType     []string  `json:"case_type" bson:"case_type"`
    LegalIssues  []string  `json:"legal_issues" bson:"legal_issues"`
    Status       string    `json:"status" bson:"status"`
    CourtDate    time.Time `json:"court_date" bson:"court_date"`
    Verdict      string    `json:"verdict" bson:"verdict"`
    Analyses     []Analysis `json:"analyses" bson:"analyses"`
}

type Analysis struct {
    CaseID    string    `json:"case_id" bson:"case_id"`
    Content   string    `json:"content" bson:"content"`
    Timestamp time.Time `json:"timestamp" bson:"timestamp"`
}

func connectToMongoDB() {
    var err error
    serverAPI := options.ServerAPI(options.ServerAPIVersion1)
    clientOptions := options.Client().ApplyURI("mongodb+srv://developer:msacQdho6LgKFUhN@cluster0.tdb6utv.mongodb.net/dbname?retryWrites=true&w=majority").SetServerAPIOptions(serverAPI)
    client, err = mongo.Connect(context.TODO(), clientOptions)
    if err != nil {
        log.Fatalf("Failed to connect to MongoDB: %v", err)
    }

    if err := client.Database("admin").RunCommand(context.TODO(), bson.D{{Key: "ping", Value: 1}}).Err(); err != nil {
        log.Fatalf("Failed to ping MongoDB: %v", err)
    }
    fmt.Println("Pinged your deployment. You successfully connected to MongoDB!")
}

func connectToOpenAI() {
    err := godotenv.Load("/workspaces/claude-engineer/.env")
    if err != nil {
        log.Fatalf("Error loading .env file: %v", err)
    }

    apiKey := os.Getenv("OPENAI_API_KEY")
    if apiKey == "" {
        log.Fatalf("OpenAI API key is not set")
    }

    openaiClient = openai.NewClient(apiKey)
}

func insertCase(caseDoc Case) error {
    collection := client.Database("Cases").Collection("AllCases")
    _, err := collection.InsertOne(context.TODO(), caseDoc)
    return err
}

func randomCaseTypeAndIssues() ([]string, []string) {
    caseTypes := [][]string{
        {"AI", "Robotics"},
        {"AI"},
        {"Robotics"},
    }

	legalIssues := []string{
		"Product Liability", "Employment Law", "Contract Law", "Consumer Protection", "Privacy", "Regulatory Compliance",
		"Blockchain Issues", "Antitrust", "Environmental Law", "Health and Safety", "Cybersecurity", "Data Protection",
		"Corporate Governance", "Labor Law", "Securities Law", "Banking and Finance Law", "Insurance Law", "Tax Law",
		"Administrative Law", "Human Rights Law", "Real Estate Law", "Immigration Law", "Trade Law", "Competition Law",
		"Criminal Law", "Family Law", "Construction Law", "Telecommunications Law", "Media Law", "Entertainment Law",
		"Sports Law", "Agricultural Law", "Education Law", "Energy Law", "Transportation Law", "Aviation Law",
		"Maritime Law", "Municipal Law", "Elder Law", "Welfare Law", "Intellectual Property Law", "Litigation", "ADR",
		"Estate Planning Law", "Admiralty Law", "Gaming Law", "Social Security Law", "Native American Law", "Space Law",
	}

	rand.Seed(time.Now().UnixNano())
	selectedCaseType := caseTypes[rand.Intn(len(caseTypes))]

	// Select 1 or 2 random legal issues
	selectedLegalIssues := []string{}
	numIssues := rand.Intn(2) + 1
	for i := 0; i < numIssues; i++ {
		selectedLegalIssues = append(selectedLegalIssues, legalIssues[rand.Intn(len(legalIssues))])
	}

	return selectedCaseType, selectedLegalIssues
}

func generateCase(w http.ResponseWriter, r *http.Request) {
    log.Println("Request received for /api/generate-case")
    caseType, legalIssues := randomCaseTypeAndIssues()

    prompt := fmt.Sprintf(`
        Generate a fact pattern for a legal case involving %v. The legal issues are %v. 
        Please provide a detailed fact pattern that is approximately 400 words long. 
        The facts should be complex and intricate enough to require a detailed legal analysis but do not include any analysis. 
        Only provide the facts. The fact pattern should include:
        - The parties involved
        - The context of the dispute
        - Key events leading up to the dispute
        - Any relevant legal principles or precedents that might apply
        
        Format it as a block of text.
    `, caseType, legalIssues)

    response, err := openaiClient.CreateChatCompletion(context.TODO(), openai.ChatCompletionRequest{
        Model: "gpt-3.5-turbo",
        Messages: []openai.ChatCompletionMessage{
            {
                Role:    "system",
                Content: "You are a legal expert and will generate detailed legal case fact patterns.",
            },
            {
                Role:    "user",
                Content: prompt,
            },
        },
    })

    if err != nil {
        log.Printf("OpenAI API error: %v", err)
        http.Error(w, fmt.Sprintf("OpenAI API error: %v", err), http.StatusInternalServerError)
        return
    }

    generatedCase := Case{
        CaseID:      "CASE" + fmt.Sprintf("%03d", time.Now().UnixNano()/1e6%1000),
        CaseName:    fmt.Sprintf("%v Legal Case", caseType),
        CaseFacts:   response.Choices[0].Message.Content,
        DateCreated: time.Now(),
        CaseType:    caseType,
        LegalIssues: legalIssues,
        Status:      "Open",
        CourtDate:   time.Now().AddDate(0, 1, 0),
        Verdict:     "Pending",
    }

    if err := insertCase(generatedCase); err != nil {
        log.Printf("Database insertion error: %v", err)
        http.Error(w, fmt.Sprintf("Database insertion error: %v", err), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(generatedCase)
}

func submitAnalysis(w http.ResponseWriter, r *http.Request) {
    var analysis Analysis
    if err := json.NewDecoder(r.Body).Decode(&analysis); err != nil {
        http.Error(w, fmt.Sprintf("Error decoding request body: %v", err), http.StatusBadRequest)
        return
    }

    log.Printf("Received analysis: %+v\n", analysis) // Log the received analysis for debugging

    if analysis.CaseID == "" {
        http.Error(w, "case_id is required", http.StatusBadRequest)
        return
    }

    analysis.Timestamp = time.Now()

    collection := client.Database("Cases").Collection("Analyses")
    _, err := collection.InsertOne(context.TODO(), analysis)
    if err != nil {
        http.Error(w, fmt.Sprintf("Database insertion error: %v", err), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    fmt.Fprintf(w, "Analysis submitted successfully")
}

func enableCors(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }
        next.ServeHTTP(w, r)
    })
}

func main() {
    connectToMongoDB()
    connectToOpenAI()
    defer func() {
        if err := client.Disconnect(context.TODO()); err != nil {
            log.Fatalf("Failed to disconnect from MongoDB: %v", err)
        }
    }()

    mux := http.NewServeMux()

    mux.HandleFunc("/api/generate-case", generateCase)
    mux.HandleFunc("/api/submit-analysis", submitAnalysis) // New route for submitting analysis

    // Wrap the mux with the enableCors middleware
    log.Println("Server starting on port 8080")
    log.Fatal(http.ListenAndServe(":8080", enableCors(mux)))
}
