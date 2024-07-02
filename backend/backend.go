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

	"github.com/clerk/clerk-sdk-go/v2"
	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
	openai "github.com/sashabaranov/go-openai"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client *mongo.Client
var openaiClient *openai.Client

type Case struct {
	ID            string    `json:"id" bson:"id"`
	UserID        string    `json:"user_id" bson:"user_id"`
	Type          string    `json:"type" bson:"type"`
	Status        string    `json:"status" bson:"status"`
	Content       string    `json:"content" bson:"content"`
	DateCreated   time.Time `json:"date_created" bson:"date_created"`
	DateSubmitted time.Time `json:"date_submitted,omitempty" bson:"date_submitted,omitempty"`
}

type User struct {
	ID             string   `json:"id" bson:"id"`
	TotalHours     int      `json:"total_hours" bson:"total_hours"`
	CompletedCases []string `json:"completed_cases" bson:"completed_cases"`
	OngoingCases   []string `json:"ongoing_cases" bson:"ongoing_cases"`
}

type Analysis struct {
	CaseID     string    `json:"case_id" bson:"case_id"`
	Content    string    `json:"content" bson:"content"`
	UserID     string    `json:"user_id" bson:"user_id"`
	Timestamp  time.Time `json:"timestamp" bson:"timestamp"`
}

type Submission struct {
	CaseID        string    `json:"case_id" bson:"case_id"`
	UserID        string    `json:"user_id" bson:"user_id"`
	Side          string    `json:"side" bson:"side"`
	Argument      string    `json:"argument" bson:"argument"`
	DateSubmitted time.Time `json:"date_submitted" bson:"date_submitted"`
}

type Grade struct {
	SubmissionID string    `json:"submission_id" bson:"submission_id"`
	GraderID     string    `json:"grader_id" bson:"grader_id"`
	Score        int       `json:"score" bson:"score"`
	Feedback     string    `json:"feedback" bson:"feedback"`
	DateGraded   time.Time `json:"date_graded" bson:"date_graded"`
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

func createCase(c Case) error {
	collection := client.Database("Cases").Collection("AllCases")
	_, err := collection.InsertOne(context.TODO(), c)
	if err != nil {
		return err
	}

	userCollection := client.Database("Users").Collection("UserData")
	filter := bson.M{"id": c.UserID}
	update := bson.M{"$push": bson.M{"ongoing_cases": c.ID}}
	_, err = userCollection.UpdateOne(context.TODO(), filter, update)
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

	selectedLegalIssues := []string{}
	numIssues := rand.Intn(2) + 1
	for i := 0; i < numIssues; i++ {
		selectedLegalIssues = append(selectedLegalIssues, legalIssues[rand.Intn(len(legalIssues))])
	}

	return selectedCaseType, selectedLegalIssues
}

func generateCase(w http.ResponseWriter, r *http.Request) {
	log.Println("Request received for /api/generate-case")

	var requestBody map[string]string
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := requestBody["user_id"]
	if !ok || userID == "" {
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}

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
		ID:           generateUniqueID(),
		UserID:       userID,
		Type:         "new",
		Status:       "ongoing",
		Content:      response.Choices[0].Message.Content,
		DateCreated:  time.Now(),
		DateSubmitted: time.Time{},
	}

	log.Printf("Generated Case: %+v", generatedCase)

	if err := createCase(generatedCase); err != nil {
		log.Printf("Database insertion error: %v", err)
		http.Error(w, fmt.Sprintf("Database insertion error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(generatedCase); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
		http.Error(w, fmt.Sprintf("Error encoding JSON response: %v", err), http.StatusInternalServerError)
		return
	}
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

    userCollection := client.Database("Users").Collection("UserData")
    filter := bson.M{"id": analysis.UserID}
    update := bson.M{"$push": bson.M{"submitted_cases": analysis.CaseID}}
    _, err = userCollection.UpdateOne(context.TODO(), filter, update)
    if err != nil {
        log.Printf("Error updating user data: %v", err)
    }

    w.WriteHeader(http.StatusOK)
    fmt.Fprintf(w, "Analysis submitted successfully")
}


func litigateCase(w http.ResponseWriter, r *http.Request) {
	var submission Submission
	if err := json.NewDecoder(r.Body).Decode(&submission); err != nil {
		http.Error(w, fmt.Sprintf("Error decoding request body: %v", err), http.StatusBadRequest)
		return
	}

	submission.DateSubmitted = time.Now()

	collection := client.Database("Cases").Collection("Submissions")
	_, err := collection.InsertOne(context.TODO(), submission)
	if err != nil {
		http.Error(w, fmt.Sprintf("Database insertion error: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(submission)
}

func judgeCase(w http.ResponseWriter, r *http.Request) {
	caseID := r.URL.Query().Get("case_id")
	if caseID == "" {
		http.Error(w, "case_id is required", http.StatusBadRequest)
		return
	}

	collection := client.Database("Cases").Collection("Submissions")
	cursor, err := collection.Find(context.TODO(), bson.M{"case_id": caseID})
	if err != nil {
		http.Error(w, fmt.Sprintf("Database query error: %v", err), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.TODO())

	var submissions []Submission
	if err = cursor.All(context.TODO(), &submissions); err != nil {
		http.Error(w, fmt.Sprintf("Error decoding submissions: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(submissions)
}

func gradeSubmission(w http.ResponseWriter, r *http.Request) {
	var grade Grade
	if err := json.NewDecoder(r.Body).Decode(&grade); err != nil {
		http.Error(w, fmt.Sprintf("Error decoding request body: %v", err), http.StatusBadRequest)
		return
	}

	grade.DateGraded = time.Now()

	collection := client.Database("Cases").Collection("Grades")
	_, err := collection.InsertOne(context.TODO(), grade)
	if err != nil {
		http.Error(w, fmt.Sprintf("Database insertion error: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(grade)
}

func createOrUpdateUser(userID string) error {
    collection := client.Database("Users").Collection("UserData")
    filter := bson.M{"id": userID}
    update := bson.M{"$setOnInsert": bson.M{"id": userID, "total_hours": 0, "completed_cases": []string{}, "ongoing_cases": []string{}, "submitted_cases": []string{}}}
    opts := options.Update().SetUpsert(true)
    _, err := collection.UpdateOne(context.TODO(), filter, update, opts)
    return err
}

func updateUserHours(userID string, hours int) error {
	collection := client.Database("Users").Collection("UserData")
	filter := bson.M{"id": userID}
	update := bson.M{"$inc": bson.M{"total_hours": hours}}
	_, err := collection.UpdateOne(context.TODO(), filter, update)
	return err
}

func submitCase(caseID string, userID string) error {
	collection := client.Database("Cases").Collection("AllCases")
	filter := bson.M{"id": caseID, "user_id": userID}
	update := bson.M{
		"$set": bson.M{
			"status":        "completed",
			"date_submitted": time.Now(),
		},
	}
	_, err := collection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		return err
	}

	userCollection := client.Database("Users").Collection("UserData")
	userFilter := bson.M{"id": userID}
	userUpdate := bson.M{
		"$pull": bson.M{"ongoing_cases": caseID},
		"$push": bson.M{"completed_cases": caseID},
	}
	_, err = userCollection.UpdateOne(context.TODO(), userFilter, userUpdate)
	return err
}

func getUserCases(userID string) ([]Case, error) {
	userCollection := client.Database("Users").Collection("UserData")
	var user User
	err := userCollection.FindOne(context.TODO(), bson.M{"id": userID}).Decode(&user)
	if err != nil {
		return nil, err
	}

	caseCollection := client.Database("Cases").Collection("AllCases")
	filter := bson.M{"id": bson.M{"$in": append(user.OngoingCases, user.CompletedCases...)}}
	cursor, err := caseCollection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var cases []Case
	if err = cursor.All(context.TODO(), &cases); err != nil {
		return nil, err
	}
	return cases, nil
}

func generateUniqueID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
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

func getCaseHandler(w http.ResponseWriter, r *http.Request) {
	caseID := r.URL.Query().Get("id")
	if caseID == "" {
		http.Error(w, "case_id is required", http.StatusBadRequest)
		return
	}

	collection := client.Database("Cases").Collection("AllCases")
	var c Case
	err := collection.FindOne(context.TODO(), bson.M{"id": caseID}).Decode(&c)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching case: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}

func submitCaseHandler(w http.ResponseWriter, r *http.Request) {
	var submission struct {
		CaseID string `json:"case_id"`
		UserID string `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&submission); err != nil {
		http.Error(w, fmt.Sprintf("Error decoding request body: %v", err), http.StatusBadRequest)
		return
	}

	err := submitCase(submission.CaseID, submission.UserID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error submitting case: %v", err), http.StatusInternalServerError)
		return
	}

	var hours int
	caseCollection := client.Database("Cases").Collection("AllCases")
	var c Case
	err = caseCollection.FindOne(context.TODO(), bson.M{"id": submission.CaseID}).Decode(&c)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching case: %v", err), http.StatusInternalServerError)
		return
	}

	switch c.Type {
	case "new":
		hours = 50
	case "litigate":
		hours = 75
	case "judge":
		hours = 50
	case "grade":
		hours = 25
	}

	err = updateUserHours(submission.UserID, hours)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error updating user hours: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Case submitted successfully and %d hours added", hours)
}

func getUserDataHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}

	collection := client.Database("Users").Collection("UserData")
	var user User
	err := collection.FindOne(context.TODO(), bson.M{"id": userID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			err = createOrUpdateUser(userID)
			if err != nil {
				http.Error(w, fmt.Sprintf("Error creating user: %v", err), http.StatusInternalServerError)
				return
			}
			user = User{ID: userID, TotalHours: 0, CompletedCases: []string{}, OngoingCases: []string{}}
		} else {
			http.Error(w, fmt.Sprintf("Error fetching user data: %v", err), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(user)
}

func getUserCasesHandler(w http.ResponseWriter, r *http.Request) {
    userID := r.URL.Query().Get("user_id")
    if userID == "" {
        http.Error(w, "user_id is required", http.StatusBadRequest)
        return
    }

    collection := client.Database("Cases").Collection("AllCases")
    cursor, err := collection.Find(context.TODO(), bson.M{"user_id": userID})
    if err != nil {
        http.Error(w, fmt.Sprintf("Database query error: %v", err), http.StatusInternalServerError)
        return
    }
    defer cursor.Close(context.TODO())

    var cases []Case
    if err = cursor.All(context.TODO(), &cases); err != nil {
        http.Error(w, fmt.Sprintf("Error decoding cases: %v", err), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(cases)
}


func main() {
	connectToMongoDB()
	connectToOpenAI()
	clerk.SetKey(`sk_test_0OUsbHPZtFjwqXAv0sOFS4CgM5LnsKSSVwCttuggTx`)
	fmt.Println("Connected to Clerk!")
	defer func() {
		if err := client.Disconnect(context.TODO()); err != nil {
			log.Fatalf("Failed to disconnect from MongoDB: %v", err)
		}
	}()

	mux := http.NewServeMux()

	mux.HandleFunc("/api/generate-case", generateCase)
	mux.HandleFunc("/api/submit-case", submitCaseHandler)
	mux.HandleFunc("/api/get-user-cases", getUserCasesHandler)
	mux.HandleFunc("/api/get-user-data", getUserDataHandler)
	mux.HandleFunc("/api/submit-analysis", submitAnalysis)
	mux.HandleFunc("/api/litigate-case", litigateCase)
	mux.HandleFunc("/api/judge-case", judgeCase)
	mux.HandleFunc("/api/grade-submission", gradeSubmission)

	log.Println("Server starting on port 8080")
	log.Fatal(http.ListenAndServe(":8080", clerkhttp.WithHeaderAuthorization()(mux)))
}
