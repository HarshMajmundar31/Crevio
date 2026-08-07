------------------------------------------------------------------------------------------------------------------
Contract ingestion module:
Upload/import contract file plus extracted terms, then lock immutable hash.
Contract lifecycle state machine:
pending -> accepted -> locked -> executed -> completed or disputed.
Compliance engine:
Evaluate deliverables, deadlines, and compliance policies from evidence.
Decision engine:
Produce confidence, reasons, trace, and immutable audit record.
Notification service:
Emit final decision and status updates.
Payment engine:
Escrow hold, release on success, refund/penalty on failure.
Admin audit module:
Execution logs, decision trails, payment records, performance metrics.
------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------
Since you are a student working with Node.js, you should prioritize services with "Always Free" tiers or specialized student credits. For contract extraction, you need more than just OCR; you need Intelligent Document Processing (IDP) that can identify specific fields like "Effective Date" or "Termination Clause."
1. Mindee (Best for Contract Specifics)
Mindee is highly recommended for developers because it has a specialized Contract OCR API. 
Mindee
Mindee
The Deal: It offers a 14-day free trial with no credit card required to test the contract-specific model. After that, they have flexible tiers based on volume.
Node.js Integration: They provide a Node.js SDK which makes it easy to send a document and get a JSON response of extracted terms.
Best Feature: It is specifically trained on legal documents from over 50 countries, with over 95% accuracy for key fields. 
Mindee
Mindee
 +1
2. Google Cloud Document AI (Best for Free Credits)
Google has a powerful "Contract Processor" that uses generative AI to parse documents. 
Google Cloud
Google Cloud
The Deal: New customers get $300 in free credits to use across any Google Cloud service, including Document AI. For many student projects, this credit can last an entire semester.
Student Extra: Eligible students (especially in India and the US) may be able to get a Google AI Pro student trial at no cost for 12 months, which includes expanded AI benefits.
Node.js Integration: Use the @google-cloud/documentai library to create a processor and handle requests. 
Google Cloud
Google Cloud
 +4
3. Tesseract.js (Completely Free & Local)
Tesseract.js is a free, open-source OCR engine. It runs directly in a Node.js environment. 
Koncile
Koncile
 +3
The Deal: It is completely free with no API limits because it runs on your machine.
The Catch: It only provides raw text. To extract specific terms, you would need to write your own logic. This could involve using Regular Expressions or a free LLM, such as Gemini, to find the relevant text in the raw output. 
Koncile
Koncile
 +2
4. Amazon Textract (Reliable Pay-As-You-Go) 
Amazon Textract is well-suited for contracts with many tables. 
Mindee
Mindee
The Deal: The AWS Free Tier includes 1,000 pages per month for the first 3 months.
Node.js Integration: It integrates with other AWS services, like S3, using the AWS SDK for JavaScript. 
Mindee
Mindee
 +2
Comparison for Students
Service 	Free Tier / Student Perk	Contract-Specific?	Best For
Mindee	14-day trial (No CC)	Yes	Quickest setup for legal fields
Google Document AI	$300 credit + Student trials	Yes	Long-term use with credits
Tesseract.js	Unlimited (Open Source)	No (Raw text only)	Total control, zero cost
Amazon Textract	1,000 pages/mo (3 months)	Yes (Tables/Forms)	Complex contract tables
Recommendation: Consider starting with Mindee to evaluate the extraction results. Then, transition to Google Document AI if the $300 credit is needed to maintain the project at no cost.   .
------------------------------------------------------------------------------------------------------------------


## A Project Report
on
## ACEMS


Submitted by

## MAJMUNDAR HARSH (2303031080050)
## THAKOR HARSHRAJ (2303031080088)
## PATEL DHRUV (2403031087006)
## PARMAR DIVYASINH (2303031080056)


Under the Guidance of
## Mr. Raunak Raj




In partial fulfillment for the award of the degree of

## BACHELOR OF TECHNOLOGY
in
## INFORMATION TECHNOLOGY





## PARUL INSTITUTE OF ENGINEERING AND TECHNOLOGY,
## PARUL UNIVERSITY,
## VADODARA, GUJARAT

## [2026-2027]

## A Project Report
on
## ACEMS



Submitted in partial fulfillment of the requirement for the award of the degree
of


Bachelor of Technology
in
## Information Technology

by

## MAJMUNDAR HARSH (2303031080050)
## THAKOR HARSHRAJ (2303031080088)
## PATEL DHRUV (2403031087006)
## PARMAR DIVYASINH (2303031080056)


Under supervision of
Mr.Raunak raj




## DEPARTMENT OF INFORMATION TECHNOLOGY,
## PARUL INSTITUTE OF ENGINEERING AND TECHNOLOGY,
## PARUL UNIVERSITY,
## VADODARA, GUJARAT


## CERTIFICATE


This is to certify that the Project Report entitled, “ACEMS” submitted by “MAJMUNDAR HARSH,
THAKOR HARSHRAJ, PATEL DHRUV, PARMAR DIVYASINH” to Parul University,
Vadodara, Gujarat, is a record of Bonafide Project work carried out by them under my supervision and
guidance,  and  is  worthy  of  consideration  for  the  award  of  the  degree  of Bachelor  of  Technology in
Information Technology of the University.




## Date :
## Place :









## Supervisor

Mr.Raunak Raj
## Assistant Professor
## Project Coordinator

## Mrs. Dhenuka
## Patel
## Assistant Professor









Head, Dept. of Information Technology
## Dr. Pooja Sapra
## Name:
## External Supervisor

## Designation:


Team-id : PIET_10   ACEMS
i

## ACKNOWLEDGEMENT
Behind any major work undertaken by an individual there lies the contribution of the people who
helped them to cross all the hurdles to achieve their goal.
It gives us the immense pleasure to express our sense of sincere gratitude towards our respected
guide Mr. Raunak Raj (Assistant Professor) for his persistent, outstanding, invaluable co- operation
and guidance. It is our achievement to be guided under him. He is constant source of encouragement
and  momentum  that  any  intricacy  becomes  simple.  We  gained  a  lot  of  invaluable  guidance  and
prompt suggestions from him during entire project work. We will be indebted of him forever and
we take pride to work under him.
We  also  express  our  deep  sense  of  regards  and  thanks  to  Dr.  Pooja  Sapra  (Professor),  Head  of
INFORMATION TECHNOLOGY Engineering Department. We feel very privileged to have her
precious advices, guidance and leadership.




Team-id : PIET_10   ACEMS
ii

## ABSRACT
The influencer marketing industry frequently faces challenges which include contract disputes
and  delayed  payments together with disputes about deliverables and the lack of neutral
enforcement methods which should  exist  between  brands  and  content  creators.  The  project
introduces  The  Autonomous  Contract  Execution  and  Monitoring  System  (ACEMS)  which
operates as a backend third-party system that automatically manages contract processes through
unbiased and secure methods. The system achieves contract execution through its  automated
processes while creating equitable conditions for all aspects of contract execution.
ACEMS system operates through secure API layers which enable users to manage campaigns
and contracts while using an AI-powered creator–brand matching system that matches creators
with  brands  according  to  their performance metrics. The system includes a rule-based state
machine which enforces contract rules and  maintains  contract  terms  until  both  parties  reach
mutual agreement. The system uses a monitoring module which provides real-time updates on
deliverable and deadline progress. The system achieves contract execution through automated
compliance checks which provide transparent contract records during all stages of the contract
lifecycle. The system maintains consistent contract execution through its combination of various
operational elements.
The system improves operational fairness through its elimination of human decision-making
which executes  compliance  checks  and  payment  processing.  The  system  demonstrates  both
modular  operation  and  scalable  design  through  its  current  capabilities  which  will  develop
advanced  contract  analysis  together  with  cross- platform  system  connectivity  in  upcoming
times.   The   system   provides   a   trustworthy   base   which   supports   autonomous   contract
management  through  digital  creator  economy  platforms  while  maintaining  transparent  and
impartial contract management operations.




Team-id : PIET_10   ACEMS
iii


## TABLE OF CONTENTS


## Certificate

Acknowledgments i
Abstract ii
List of Tables V
List of Figures V
## 1. Introduction
1.1 problem statement
## 1.2 Motivation
1.3 Aim and Objective
## 1.4 Scope
## 1
- Literature review
2.1 Critical Evaluation of Research papers
2.2 Summary of Research Papers
2.3 Limitations/ Drawbacks of Existing System
## 2.3.1 Advantages
## 2.3.2 Disadvantages
## 5
- Problem Definition and requirement Analysis
## 3.1 Problem Definition
## 3.2 Requirement Analysis
## 3.2.1 User Requirements
## 3.2.2 Functional Requirements
## 3.2.3 Non- Functional Requirements
## 14
- Design and Implementation
## 4.1 Design
4.1.1 Use Case of System
4.1.2 Flow Chart of System
## 4.1.3 Sequence Diagram




## 17


Team-id : PIET_10   ACEMS
iv

## 4.2 Implementation
## 4.2.1 Implementation Environment
## 4.2.2 Front End Technology
## 4.2.3 Back End Technology
## 4.2.4 Snapshots
- Testing and Deployment
## 5.1 Testing
## 5.2 Deployment

- Analysis and Results
## 6.1 Result
## 6.2 Analysis

- Conclusion and Future enhancements
## 7.1 Conclusion
## 7.2 Future Enhancements
## 28
## 8. References 29


Team-id : PIET_10   ACEMS
v



## LIST OF TABLES




## LIST OF FIGURES


## Figure 4.1.1.1 Contract Execution Diagram 18
## Figure 4.1.1.2 Brand Contract Management System Diagram 18
## Figure 4.1.1.3 Content Verification System Diagram 19
## Figure 4.1.1.4 Creator Campaign Participation Diagram 19
## Figure 4.1.1.5 Payment System Diagram 20
## Figure 4.1.1.6 Admin Monitoring System Diagram 20
## Figure 4.1.2.1 Authentication Workflow Diagram 21
## Figure 4.1.2.2 Decision Logic System 22
## Figure 4.1.2.3 Complete Contract Lifecycle Flow 23
Figure 4.1.3.1 Sequence Diagram of ACEMS 24
## Figure 4.1.3.2 Creator Sequence Diagram 24
## Figure 4.1.3.3 Brand Sequence Diagram 25
## Figure 4.1.3.4 Decision Engine Processing Diagram 25
## Figure 4.1.3.5 Final Decision Notification Diagram 26
## Figure 4.1.3.6 Rule Engine Evaluation Diagram 26
## Figure 4.1.3.7 Master Sequence Diagram 27
## Table 2.1 Research Paper


Team-id : PIET_10   ACEMS
Page 1 of 30


## CHAPTER 1 INTRODUCTION
## 1.1. PROBLEM STATEMENT:-
Influencer marketing industry has expanded very fast, yet it is still struggling with serious operation
issues concerning contract execution and compliance management. The brands and content creators
are prone to conflict because of subjective explanations of the terms of delivery, late payments, and
the lack of neutral enforcement tools. The current platforms are very manual-driven, creating bias,
fluctuations, and ineffective processes during the entire contract lifecycle.
The  existing  influencer  marketing  systems  do  not  have  automatic  systems  to  guarantee  the
immutability  of  contracts  once  they  are  made.  This  permits  post-approval  changes,  irregular
decisions on compliance and disagreements after the campaign has been executed. Moreover, the
payment  disbursement  is  in  many  cases  delayed  because  of  the  need  to  manually  check  the
deliverables, which causes the lack of trust between the stakeholders and low transparency in the
contractual performance.
The  second  significant  shortcoming  of  the  current  workflows  is  that  there  is  no  real-time
compliance monitoring and objective decision-making. The majority of platforms rely on human
man  to  analyze  the  fulfillment  of  contractual  obligations,  and  it  may  lead  to  inaccuracy,  biased
interpretation, or bias. It is also not very much provided to keep auditable records that effectively
explain compliance decisions and payment results.
Thus, it is highly desired that a secure and automated and unbiased system can handle influencer
contracts end-to-end, without human influence. The issue to this project is the deficit of a scalable
backing framework that has the ability to implement contract logic and track deliverables in real-
time and perform payments in  a  transparent  manner.  The  suggested  Autonomous  Contract
Execution and Monitoring System (ACEMS) seeks to resolve these issues by giving an immutable,
rule-based, and auditable contract execution system to influencer marketing systems


Team-id : PIET_10   ACEMS
Page 2 of 30

## 1.2 MOTIVATION:-
The accelerated rise of digital platforms  and social media has  made influencer marketing highly
important in the contemporary advertising practices. The use of influencers to advertise products
and services is on the rise among brands owing to their capacity to connect with the right consumers
and create trust. Nevertheless, the trade procedures of influencer collaborations are quite manual
and poorly controlled even though they are very popular and economical. This poses  some
difficulties in contract management, content deliverability, and payment between content creators
and brands on time.
Among the key incentives to drive this project, we can recognize the number of conflicts, which
are often arising because of the ambiguity of terms of a contract and the possibility of subjective
understanding  of  campaign  deliverables.  Influencer  contracts  usually  consist  of  several  clauses
connected  to  the  posting  schedule,  the  quality  of  content,  the  level  of  engagement,  and  the
promotion. In case these conditions are kept by hand, it is hard to keep consistency and fairness in
the decision-making process. Consequently, there is often a conflict among the stakeholders on
whether they have met the terms and conditions of the contract, and this matters in the end to the
ecosystem trust.
The  majority  of  current  influencer marketing  solutions rely  on  the  internal departments  or  the
platform managers to assess compliance and send money. This may lead to bias, inconsistency and
delays in decision-making, as such reliance on human judgment is possible. Moreover, due to the
lack of formal monitoring mechanisms, it is hard to keep credible records that can be used to support
compliance results. Such transparency lack leads to less accountability and greater chances of conflict
once the campaigns are over.
The rationale of the Autonomous Contract Execution and Monitoring System (ACEMS) creation is
thus  to  overcome  such  hurdles  with  the  introduction  of  an  automated  and  transparent  contract
management  system  without  being  biased  in  influencer  contract  management.  The  system  will
enhance the level of trust between brands and creators since the execution of the contract will be
carried out fairly and consistently. Removing the subjective side of decision-making and providing
an  opportunity  to  monitor  campaign  deliverables  in  real-time,  ACEMS  plans  to  minimize  any
controversy,  enhance  efficiency  in  operations,  and  create  a  stable  governance  system  within  the
digital creator partnerships.


Team-id : PIET_10   ACEMS
Page 3 of 30


## 1.3 Aim & Objective:-
The main goal of the following project is to have an automated backend system that will be able to
handle the lifecycle of influencer marketing contracts in a secure, transparent, and unbiased way.
It  is  the  system  that  seeks  to  remove  manual  access  to  monitoring  and  executing  contracts  and
implement rule-based contract enforcement systems with automatic compliance checks.
The  other  objective  is  to make  sure  that  the  agreement is  immutable  as  soon as  both the  parties
agree  with  their  contracts.  The  system  ensures  that  no  unauthorized  changes  are  made  to  the
contracts once approved since it does this by locking the contracts such that all the stakeholders
strictly  follow  the  terms  and  conditions  agreed  upon.  This  assists  in  ensuring  equitability  and
consistency in agreement of the contract and minimizes chances of conflict.
Another  goal  is  the  creation  of  a  real-time  monitoring  system  that  is  able  to  track  campaign
deliverables  and  deadlines.  The  system  must  have  the  automated  check  of  the  fulfillment  of
contractual  obligations  and  give  the  relevant  actions  like  payment  disbursement  or  penalty
application. This will guarantee the right time implementation and enhance accountability in the
influencer marketing processes.
Lastly, the project will also develop a scalable and modular system architecture that can be extended
through  future  developments  to  include  AI-driven  contract  analysis,  advanced  compliance
assessment,  and  connection  to  various  social  media  platforms.  By  means  of  these  goals,  the
Autonomous Contract Execution and Monitoring System (ACEMS) proposed is aimed at offering
a  trusted framework under which the  management of the influencer marketing contracts may be
carried out effectively and without bias.

## 1.4 SCOPE:-
This project scope is dedicated to the design and development of an automated contract execution
and  monitoring  system  in  the  influence  marketing  platforms  based  on  the  backend.  The  system
concerns  mainly  the  difficulties  associated  with  enforcement  of  the  contract  and  verification  of
compliance and execution of payment between the brands and creators of the content. ACEMS is
supposed to be a neutral back office entity, which makes the contract lifecycle fair and consistent.


Team-id : PIET_10   ACEMS
Page 4 of 30

The project encompasses the initiation of secure contract management capabilities, such as creation
of  contracts,  contract  approval,  immutability,  and  rule-based  execution  of  contracts.  It  also
incorporates  the  real-time  tracking  of  the  campaign  deliverables  and  deadlines  to  ensure  the
compliance  is  achieved  automatically.  The  system  can  operate  in  areas  such  as  automatic
disbursement of payments and imposition of penalties according to set contract policies.
The area is also expanded to the implementation of an AI-based creator-brand matching platform
that assists in the determination of appropriate influencers based on the specifics of the campaign
and the performance indicators of the past. The system also has systematic and open audit trails
that  document  all  the  contract  activities  and  hence  accountability  and  traceability  of  decisions.
Nevertheless, the project is at the present restricted in the general aspects of the development of the
backend   system,   which  does   not  involve   frontend   user  interface   development   and   direct
connectivity to external social media. The further development of such functions as drafting legal
contracts,  resolving  disagreements  with  the  help  of  the  legal  systems,  and  real-time  analytics  in
social media is regarded as out of scope of the current implementation.
As regards the future scope, the system can be scaled to accommodate superior AI-based contract
analysis,  cross-platform  integrations,  and  better  compliance  assessment  procedures.  ACEMS  is
scalable and adaptable with the modular architecture, which is why it can be adopted into various
digital creator ecosystem


Team-id : PIET_10   ACEMS
Page 5 of 30


## CHAPTER 2 LITERATURE REVIEW
2.1 Critical Evaluation of General Papers:-

## Sr.
## No.
## Publication
## Year
## Author Publication
## House


## Summary Research Gaps


## 1 2024 Hao Ding,
## Yizhou Liu,
## Xuefeng Piao
SSRN The system detects
vulnerabilities in smart
contracts through its
combination of
CodeBERT-based RAG
and Self-Check Chain-of-
Thought which achieves
better results than
conventional static
analysis tools.
The approach breaks down
when the prompt gets too long,
and if the base model
hallucinates on complex logic,
the self-check mechanism has
no real fallback to catch it.
## 2 2025 P.S.G.
## Arunasri, Phani
## Kumar Solleti,
## M. Sailaja, P.
Mathiyalaga n,
Kathiravan G.K.,
## M.
## Soma Sabitha
## SCITEPRES
## S
The system takes contract
elements from legal
documents and transforms
them into blockchain
modular templates which
use Solidity and
Chaincode to create
dynamic contract clauses.
The system tests these
templates through real-
world simulations as a
method of validation.
Everything was tested on
simulations only with no real-
world deployment evidence.
Mapping legal nuances cleanly
across different jurisdictions
remains a hard, unsolved
problem.
## 3 2024 Moez Krichen,
## Mariam Lahami,
## Qasem Abu Al-
## Haija
Journal of
Network and
## Computer
## Applications
A comprehensive
literature review on
theorem proving, model
checking, and software
testing approaches to
verify smart contracts.
These techniques demand
specialist knowledge and don't
scale well to large contracts.
The tools themselves aren't
mature enough for widespread
practical adoption yet.


Team-id : PIET_10   ACEMS
Page 6 of 30


## 4 2025 Tudor
Ferariu,Philip
## Wadler, Orestis
## Melkonian
FMBC 2025 The research presents a
comprehensive
examination of current
formal methods used to
create smart contract
specifications, which the
authors organized into
different categories based
on their respective
modeling and testing
capabilities.
The paper is a review only with
no new tool or fresh
evaluation.
Some referenced work may
already be outdated by 2026,
and no performance
comparisons are provided
between approaches.
## 5 2025 Alfred Kuhlman,
## Arya Wicaksana
JOWUA Refining MiscSkill-
Inquire (7B) in a
productive exercise. These
units were to be enrolled
to generate Contract data,
in reference to a specific
Gas.(one model) .
Output quality depends entirely
on the fine-tuning dataset. The
model can still introduce subtle
logical errors, and it was only
tested on a limited set of
contract scenarios.
## 6 2025 Joongho Ahn,
## Moonsoo Kim
Electronics These seven- layerally
manned Al agents-what
might be in traditional
computer programing
parlance termed
"persona"-to operate on
ElizaOternity
personalization personas
on social media
functionalities.
Good user ratings don't
guarantee real adoption.
Performance was inconsistent
with noticeable latency
differences across platforms,
and scalability remains
unproven.


Team-id : PIET_10   ACEMS
Page 7 of 30


## 7 2024 Ye Liu, Yue Xue,
## Daoyuan Wu,
## Yuqiang Sun, Yi
## Li, Miaolei Shi,
## Yang Liu
NDSS 2025 The system uses RAG
together with GPT-4 for
automatic creation of
formal verification
properties which results in
80% recall performance
and detection of 26
already established
vulnerabilities plus 12
previously unknown
security risks.
The pipeline depends heavily
on the quality of the reference
property database.
The LLM can still generate
incomplete properties, and an
external prover is always
required.
## 8 2023 Tharaka
## Mawanane Hewa,
## Yining Hu,
## Madhusanka
IEEE The survey provides a
complete analysis of
smart contract platforms
through its evaluation of
technical attributes and its
identification of existing
challenges and upcoming
research areas.
Transaction throughput and
latency are still bottlenecks.
Critical coding vulnerabilities
keep appearing, and no unified
solution has emerged to
address them across different
platforms.
## 9 2024 Reto Hofstetter,
## Andreas Lanz,
## Navdeep S. Sahni
Journal of
## Industrial
## Information
## Integration
The research analyzed
approximately 1000 real
influencer contracts
which showed that
relaxing contractual
limitations resulted in
three times higher
influencer retention rates
while maintaining the
same financial expenses.
The study covers only
traditional non- blockchain
contracts.
Findings are specific to the
observed platforms, and no
automated execution or
monitoring system is proposed.


Team-id : PIET_10   ACEMS
Page 8 of 30


## 10 2023 Bagam Laxmaiah,
## S. Subburam
IEEE The solution combines
machine learning models
with smart contract
technology to enable
continuous monitoring of
fake product detection
which results in improved
supply chain security.
Regulatory compliance and
cross- platform
interoperability remain tricky.
Scaling the system and
managing new risks
introduced by full automation
haven't been fully addressed.
## 11 2024 Cristian Valencia-
## Payan, David
## Griol, Juan Carlos
## Corrales
Journal of
Logic and
## Computation
An autonomous smart
contract feeding itself
with an integrated ML
anomaly detection
working in a supply chain
context at a speed of 184
tps with latency of only
## 0.41sec.
More work is needed for
complex or evolving supply
chain disruptions. The ML
component lacks detailed
documentation, and the
system is scoped only to
traceability use cases.
12 2025 Saad AL Azzam,
Raenu AL
Kolandaisa my,
Ghassan AL
## Dharhani
## Mesopotamia
n Journal of
## Big Data
The study systematically
reviews artificial
intelligence machine
learning and deep
learning techniques that
researchers have
developed to secure smart
contracts which concrete
audits fail to detect
complex logical
vulnerabilities.
Interoperability across chains
is still a barrier. Legal
enforcement lags behind
technical capability, and
sharing contract data across
parties raises unresolved
privacy concerns.


Team-id : PIET_10   ACEMS
Page 9 of 30


## 13 2024 Sirui Hong,
## Mingchen Zhuge,
## Jiaqi Chen
ICLR 2024 The meta- programming
framework uses
structured prompts to
create standard operating
procedures which it
implements through its
role- based multi-agent
system in order to
decrease false information
and enhance its ability to
handle tasks.
The framework is only as
strong as the underlying
LLM. Writing effective SOPs
requires significant care, and
evaluations have mostly been
limited to software
engineering tasks.
## 14 2024 Tomasz Górski Applied
## Sciences
The system transforms
smart contract source
code into graph formats
which it uses to develop
deep learning models. The
system removes the need
for manual rule
development through its
automatic rule generation
capability.
Developers must follow a
specific object-oriented or
functional programming
structure, which creates a real
barrier for beginners and
limits broader adoption of the
pattern.


Team-id : PIET_10   ACEMS
Page 10 of 30

## 15 2024 Yu Sun,
## Daoyuan Wu,
## Yue Xue, Han
## Liu
IEEE The system establishes
specific scenarios for
testing logic
vulnerabilities while using
static analysis to verify
GPT results, which
enables fast and
affordable detection of
advanced security
weaknesses.
Reasoning quality is capped
by the underlying model's
capability.
Precision drops noticeably
when contracts being
analyzed are very large or
structurally complex.
## 16 2021 T. Pujiati, M.
## Kamil, N.
Silawati, RS
## Ikhsan
ADI Journal The study used mixed
methods to combine big
data analysis with case
studies and it proved that
demand forecasting
accuracy and supply chain
risk resilience had both
achieved substantial
improvements.
Findings are tied to specific
industry case studies and don't
generalize easily. There is also
no ethical governance
framework guiding AI
decisions in high-stakes
supply chain contexts.
## 17 2025 Zhiyuan Wei,
## Jing Sun,
## Yuqiang Sun
IEEE The Double-Mode
analysis (.broad target and
.adding2) achieves 98%
accuracies on the
common vulnerabilities,
and even with shared
auditing costs, contract
costs can be dramatically
reduced.
The targeted analysis mode is
computationally expensive.
Both performance and cost
scale with contract size,
making it impractical for very
large or complex codebases.



Team-id : PIET_10   ACEMS
Page 11 of 30


## 18 2024 Iqra Mustafa,
Alan McGibney,
## Susan Rea
Frontiers in
## Blockchain
The GRV-SC
engineering framework
employs Colored Petri
Nets together with a type-
safety verifier to provide
complete coverage of
smart contract
development while
detecting access control
violations.
The framework is tied
specifically to the DAML
platform. Formal modeling
adds meaningful upfront
effort, and newly emerging
vulnerability types not
anticipated at design time can
still go undetected.
## 19 2023 A. Barunaha,
MR Prakash,
## R. Naresh
Atlantis Press Monitors the Twitter feed,
extracting relevant tweets
that carry such business
significance.
According to them, posts
with negative propensity
may be integral to the
analysis, which could
then be refreshed into the
model through the
learning mechanism
classic to this kind of
supervised learner.
The classifier struggles with
sarcasm and irony, two things
that show up constantly in
social media.
Overall accuracy sits at
around 76%, which leaves a
lot of room for
misclassification.
## 20 2021 Ree Chan Ho,
## Muslim Amin,
## Kisang
RyuCorrespo
nding Author,
## Faizan Ali
## Emerald
## Publishing
## Limited
(journal of
hospitality &
tourism
technology)
This study develops an
"integrative model" based
on the UTAUT framework
to explain "travelers’
continued use of smart
travel app itineraries",
finding that "hedonic and
utilitarian values"
strongly influence their
intention to use these
digital tour plans.
The approach only captures
state- machine behavior, so
anything more dynamic falls
outside its scope.
Because deployed contracts
are immutable, there's no way
to push runtime upgrades
once the contract is live.


Team-id : PIET_10   ACEMS
Page 12 of 30


## 2.2 SUMMARY OF RESEARCH PAPER:-
 Multiple studies investigate the automatic generation and validation and security of smart
contracts through artificial intelligence and formal verification techniques.
 The combination of LLMs with retrieval-augmented generation (RAG) systems leads  to
better accuracy in smart contract vulnerability detection according to research papers which
utilized CodeBERT and PropertyGPT.
 The Code LLaMA model allows users without specialized training to create working and
cost-effective Solidity contracts through its specialized programming capabilities.
 Theorem proving and model checking serve as formal verification methods which provide
complete correctness proof but their usage faces challenges because of their complicated
nature and unavailability of mature tools.
 The  MetaGPT  multi-agent  LLM  framework  divides  complex  contractual  work  into
different  expert roles  which  helps  to  decrease  overlapping  errors  while  producing  better
results.
 The  GPTScan  and  PropertyGPT  tools  use  GPT-based  reasoning together  with  static
program analysis to identify both common and zero-day logic vulnerabilities which they
handle with high detection rates and minimal expenses.
 The smart contracts that employ self-updating mechanisms together with ML models
achieve operational capabilities of 184 tps and 0.41s latency which makes them ideal  for
real-time supply chain tracking.
 The execution of  legal contracts on blockchain technology faces challenges  because
different jurisdictions require distinct regulations and there may be a need for off- chain
legal processes.
 Smart contract life-cycle management frameworks demand complete development process
coverage because this method enables early detection of access control.


Team-id : PIET_10   ACEMS
Page 13 of 30


## 2.3 LIMITATION/DRAWBACKS OF EXISTING SYSTEM:-
 The first smart contract validation system needs two particular elements because it cannot
process extensive contracts during a single validation session.
 Existing vulnerability detection tools require base LLM model quality yet they produce
false results when the model encounters intricate logical structures.
 Current formal verification methods require developers to possess advanced expertise
because they only support experts through theorem proving and model checking.
 Formal  verification  tools  face  major  scalability  challenges  because  they  cannot  process
extensive smart contracts which contain multiple nested elements.
 Existing  systems  support  only  particular  blockchain  platforms  such  as  Ethereum  and
Hyperledger  which  creates  difficulties  for  users  who  want  to  use  their  systems  across
different platforms or jurisdictions.
 Smart  contracts  need  off-chain  legal  systems  to  resolve  their  disputes  because  currently
existing solutions do not provide complete automated processes.
 Most AI-based contract generation tools depend heavily on the quality of their fine-tuning
dataset and the LLM introduces subtle logical errors which remain hidden.
 Existing multi-agent frameworks like MetaGPT still depend on careful SOP design and have
mainly been evaluated on software engineering tasks which limits their ability to function
in different situations.
 Current supply chain smart contract systems can only trace specific materials because their
systems  use  limited  traceability  functions  which  cannot  deal  with  evolving  operational
interruptions.
 The  interoperability  challenges  which  smart  contract  vulnerability  detection  systems
experience  create  major  obstacles  for  their  implementation  across  various  blockchain
networks and legal systems.
 Privacy  concerns  related  to  shared  blockchain  data  remain  unresolved  because  sensitive
contract information continues to exist on public and semi-public ledgers.
 Smart contracts executed on blockchain technology face legal enforcement gaps because
their operation does not extend legal validity across different jurisdictions.
 The  LLM-powered  vulnerability  detection  tools  which  use  GPTScan  experience  major
accuracy  reduction when they process smart contract projects which consist of extensive
detailed components or sophisticated elements.


Team-id : PIET_10   ACEMS
Page 14 of 30

## CHAPTER 3 PROBLEM DEFINITION
## AND REQUIREMENT ANALYSIS
## 3.1 Problem Defination: -
The fast evolution of influencer marketing has revealed a number of operational and trust-related
challenges  of  the  existing  contract  management  systems.  The  majority  of  platforms  depend  on
manual  contract  management  and  human  judgments  to  check  deliverables  and  compliance  that
usually causes delays, discrepancies and conflicts between brands and content creators. Since there
are no standardized mechanisms of enforcement, it is hard to agree that both parties should follow
terms of the contract in a fair manner.
The other significant issue is lack of contract impossibility once approved. The contracts in most
instances  can  be  changed  or  reinterpreted  once  they  have  been  received  though  that  creates
misunderstanding  and  conflicts  in  the  post  campaign.  Late  payments  due  to  slowness  in  the
verification  process  are  another  factor  that  affects  less  trust  and  satisfaction  amongst  creators.
Besides, transparency is not very much evident since most of the systems lack adequate audit trails
or live monitoring campaign activities.
The  above  difficulties  underscore  the  necessity  of  having  a  safe,  computerized, and  objective
contract execution system. The issue that this project seeks to solve is the absence of an independent
mechanism  that  has  the  ability  to  lock  contracts  once  given  the  green  light,  constantly  surveil
deliverables  and  imposes  payments  or  fines unless  the  human  touch  is  applied.  All  these  issues
need  to  be  addressed  with  the  aim  of  enhancing  fairness,  efficiency,  and  reliability  in  the
management of influencer marketing contract.
## 3.2 Requirement Analysis : -
The requirement analysis is an important process during system development of ACEMS, since it
determines what the system should attain to address the problems identified. The main objective of
this  step  is  to  know  the  expectations  of  the  users  and  translate  them  into  understandable  system
functions. The system requirements are derived after evaluating the current contract management
constraints in order to provide automation, transparency, and equity in the life of the contract.
Brands, content creators, and administrators, with the primary need and access levels, should be
supported  by  the  system.  Brands  need  to  have  an  easy  system  to  generate,  post,  and  administer
contracts, and creators need straightforward systems to apply to each campaign, deliverables, and
payment  status.  IT  administrators  need  complete  access  to  system  monitoring,  rule  setting,  and
resolution of disputes.


Team-id : PIET_10   ACEMS
Page 15 of 30

Functional  requirements  concentrate  on  automated  contract  execution,  rule-based  compliance
check,   real-time   deliverable   tracking   and   automated   payment   processing.   Non-functional
requirements  focus  on  the  security,  scalability,  performance  and  reliability  factors  in  order  to
provide a smooth running of the system. Sound requirement analysis will make sure that ACEMS
fulfills  the  technical  requirement  and  the  user  expectation  providing  a  solid  base  to  the  system
design and implementation.
## 3.2.1 User Requirements : -
User requirement is the expectation and requirement of all the stakeholders who interact with the
ACEMS  platform.  The  main  consumers  of  the  system  are  the  brands,  content  creators  and
administrators  of  the  system,  who  need  to  have  certain  functionalities  to  carry  out  their  duties
effectively.  These  requirements  are  essential  in  ensuring  that  the  system  is  not  complicated,  is
reliable and also that it complies with real life use cases.
The brands need a straightforward and safe application to design campaigns, post contracts, outline
deliverables,  and  provide  terms  of  payment.  They  should  also  have  real-time  access  to  contract
status,  compliance  by  the  creator  and  execution  of  payments.  Content  producers  are  demanding
easy  access  to  the  listing  of  the  campaign,  easy  acceptance  of  contracts  with  hitches,  well-
established procedures of submitting the deliverables, and clear tracking of the payment without
delays.
Administrators must have full control over the system to track the activities in the platform, regulate
the rules, and guarantee system integrity. Every user needs a secure authentication, roles and valid
notifications. With these user requirements, the interaction process, trust, and workflow across the
contract management system will be smooth.

## 3.2.2 Functional Requirements :-
 Functional requirements explain the operations and features that the ACEMS system will
be required to carry out. These requirements determine how the system is going to behave
and how various components will relate to each other to make sure the contract is run and
monitored  smoothly.  They  are  concerned  with  automation  of  processes  which are  being
done manually in the present systems.
 The system should enable the brands to design and enter contracts, specify the campaign
guidelines,  and  choose  creators  according  to  the  pre-established  parameters.  It  needs  to
assist in approving contracts automatically, locking approved contracts and implement the
rule without human intervention. Creators should also be allowed to apply to campaigns,


Team-id : PIET_10   ACEMS
Page 16 of 30

accept contracts, and deliverables within given deadlines through the system.
 Also, the system is supposed to monitor the  deliverables in real time,  verify compliance
automatically, and automatically trigger payment or penalties. The functional requirements
also  include  audit  logging,  notification  services,  and  administration  monitoring  tools  to
maintain accountability, transparency and reliability of the system.

3.2.3 Non-Functional Requirements : -
 The  non-functional  requirements  specify  quality,  the  performance,  and  the  reliability
requirements  that  the  ACEMS  system  shall  have.  These  specifications  make  the  system
run in an efficient and safe manner, at varying conditions. Although they are not detailed
of   particular   functions,  they   have   a   significant   influence   on   user   experience   and
trustworthiness of the system.
 It should also have robust security capabilities, such as secure authentication, encryption
of the data and against unauthorized access. It is necessary to have high performance and
speed in response time to ensure the users will have access to contract information and a
current system response as quickly as possible. The system must be scalable to serve an
increasing   number   of   users,   campaigns   and   contracts   without   compromising   the
performance.
 The  other  important  one  is  reliability  and  availability  which  means  that  there  would  be
minimum  downtime  and  constant  operation.  The  system  should  be  able to  keep  correct
audit records  and should provide  fault recovery. These  non-functional requirements  will
make sure that ACEMS is reliable and secure enough to support real-life workload.


Team-id : PIET_10   ACEMS
Page 17 of 30

## CHAPTER 4 DESIGN AND IMPLEMENTATION
## 4.1 Design :-

Design  phase  is  the  basis  of  the  proposed  system  and  is  aimed  at  transforming  the  conceptual
requirements into a systematic and implementable system model. This step makes sure that system
is synchronized to the expectations of the users, functional requirements and long term scalability
objectives.

##  Understanding User Needs:
Identifying the needs of the stakeholders such as brands, content
makers, and  platform  administrators  is  the  starting  point  of  the
design process. The step assists in specifying functionalities of the
system without causing unevenness, transparency, and usability.
 Prototyping the System Architecture:
A finer system blueprint is then developed based on the obtained
requirements  to  describe  the  general  sequence  of  the  work  and
interaction between the modules. This involves defining stages of
the contract lifecycle, implementation flows depending on rules,
monitoring and data storage forms.
 Selection of Technology:
Practicality   in   real-time   processing,   safe   transactions,   and
modular development is the basis of the selection of the databases,
API  services,  and  automation  tools.  The  choice  of  technology
stack  is  made  to  make  sure  that  it  is  extensible  and  can  be
integrated in the future.
##  Security Factors:
The issue of security is also a major concern of the design stage
because  the  system  will  deal  with  the  sensitive  contract  and
payments information. The design includes measures like access
control,   data  encryption,  safe   authentication,   and  role-based
permissions.  The  mechanisms  enable  integrity  of  data,  avoid
unauthorized access and trust among the users of the system.





Team-id : PIET_10   ACEMS
Page 18 of 30

## 4.1.1 Use Case Diagram : -


## Figure 4.1.1.1 Contract Execution
This above figure represents the Contract Execution process in the ACEMS system. Once a contract
is accepted  by both parties, ACEMS first locks  the  contract to prevent any further changes. The
system then  interacts  with an  external Verification Service to confirm the  contract details.  After
verification,  ACEMS  checks  the  post  timestamp  to  ensure  deliverables  are  submitted  on  time.
Finally, the system validates the creator’s deliverables to determine compliance before proceeding
with payment or penalties.

## Figure 4.1.1.2 Brand Contract Management
## System
This diagram shows how a brand interacts with the contract management system. The brand first
logs in and uploads a contract related to a campaign. It then defines campaign requirements and
payment terms clearly before submitting the contract. After submission, the brand can continuously
view  the  contract  status  to  track  approval and  progress.  This  ensures  organized  and  transparent
contract creation from the brand’s side.


Team-id : PIET_10   ACEMS
Page 19 of 30


## Figure 4.1.1.3 Content Verification System
Here, Content Verification system sends a Request Content Verification in response to the ACEMS
actor  requesting  it. The  system  then  communicates  with  the  Social  Media  API  to  retrieve  the
necessary  information  on  the  post.   Then,  it  checks  the  post  date,  i.e.  whether it  was  within  the
required time frame or not. Finally, it improves the confirmation of engagement indicators (likes,
comments, shares, etc.) to make sure that the content is of the proper standards of verification.


Figure 4.1.1.4Creator Campaign Participation
This diagram explains the process followed by content creators in the system. The creator registers
or  logs  in,  browses  available  campaigns,  and  applies  for  a  suitable  contract.  Once  selected,  the
creator accepts the contract and submits the required deliverables. The system also allows creators
to track their payment status, ensuring clarity and trust throughout the campaign lifecycle.


Team-id : PIET_10   ACEMS
Page 20 of 30


## Figure 4.1.1.5 Payment System
This diagram shows how money is handled securely in a payment system using escrow. The brand
deposits  funds,  which  the  system  holds  until  certain  conditions  are  met.  When  the  contract  is
successfully completed, the system triggers payment release through the payment gateway to the
creator.  If  the  contract  fails  or  payment  cannot  be  processed,  the  system  refunds  the  brand.  It
ensures fairness by protecting both sides until rules are satisfied.

## Figure 4.1.1.6 Admin Monitoring System
This diagram highlights what an admin can do to oversee the system. The admin can view logs,
monitor contract execution, audit past decisions, check payment records, and track overall system
performance. Each function gives visibility into different aspects of the system, helping maintain
transparency and reliability. In short, it’s a dashboard of tools for keeping everything running
smoothly and accountable.


Team-id : PIET_10   ACEMS
Page 21 of 30

4.1.2 Flow Chart of System : -




## Figure 4.1.2.1 Authentication Workflow Diagram

This diagram shows how a user logs in with email and password. The system checks credentials by
finding the user and comparing the password hash. If correct, it creates a JWT token and sends it
back.  The  user  then  includes this token in future requests to prove they’re authenticated. It’s a
secure way to manage login session.


Team-id : PIET_10   ACEMS
Page 22 of 30





## Figure 4.1.2.2 Decision Logic System

This  flow  explains  how  the  system  decides  if  a  contract  execution  is  successful.  It  checks
deliverables  (like  platform  match  and  post  count),  deadlines,  and  compliance  rules  (such  as
disclosures and prohibited content).


Team-id : PIET_10   ACEMS
Page 23 of 30



## Figure 4.1.2.3 Complete Contract Lifecycle Flow

This diagram shows how a contract moves between a brand, a system, and a creator. Both log in,
then the brand uploads a contract and adds rules. The creator accepts it, locking the contract so it
can’t be changed. Later, the brand executes the contract, and the system evaluates whether the rules
were followed. The outcome is either success or failure, ensuring fairness and immutability


Team-id : PIET_10   ACEMS
Page 24 of 30

## 4.1.3 Sequence Diagram : -


Figure 4.1.3.1 Sequence Diagram of ACEMS
The diagram  illustrates  how  the  ACEMS  system  manages  user  interactions,  authentication,  data
handling,  and  contract  verification.  It  shows  the  step-by-step  flow  of  requests  between  the  user,
frontend, backend, database, and contract verification module, ensuring secure login, efficient employee
data management, and reliable contract validation.


## Figure 4.1.3.2 Creator Sequence Diagram
This sequence diagram outlines the contract acceptance and verification process between a creator,
platform,  brand,  and  contract  verification  system.  It  shows  how  the  creator  initiates  contract
acceptance,  the  platform  informs  the  brand,  and  the  brand  ensures  validation  through  the
verification system before confirming back to the creator.



Team-id : PIET_10   ACEMS
Page 25 of 30


## Figure 4.1.3.3 Brand Sequence Diagram

This diagram demonstrates the contract verification workflow among the brand, platform, creator,
and  verification  system.  It  begins  with  the  brand  uploading  a  contract,  which  is  passed  to  the
platform and then to the creator for validation. The creator engages the contract verification system,
receives a  notification, and relays  the  verification result back through the  platform to the  brand,
ensuring transparency and structured communication at each stage.

## Figure 4.1. 3.4 Decision Engine Processing  Diagram

This diagram  highlights  the  workflow of a  decision  engine  within  a  system.  The  user  submits  a
request,  which  the  system  forwards to  the  decision  engine.  The  engine  retrieves  rules  from  the
database, evaluates them, and generates a result. Finally, the system returns the decision to the user,
ensuring a structured and rule-based process for handling requests.



Team-id : PIET_10   ACEMS
Page 26 of 30



## Figure 4.1.3.5 Final Decision Notification System
This  diagram illustrates the notification flow for final decisions  in a  system. The user submits a
request,  which  the  system  processes  through  the  decision  engine.  Once  the  engine  generates  a
result, it is passed to the notification service, which relays the outcome back through the system to
the  user—ensuring that decisions  are  both processed  and  communicated in a  structured,  reliable
manner.


## Figure 4.1.3.6 Rule Engine Evaluation

This diagram explains the Rule Engine Evaluation workflow. The user submits a query, which is
collected as an evaluation request and sent to the rule engine. The rule engine fetches rules from
the  database,  evaluates  them  against  the  provided  data,  and  returns  the  results  through  the
evaluation  request  back  to  the  user.  This  structured  flow  ensures  that  queries  are  processed
consistently and decisions are generated based on predefined rules.





Team-id : PIET_10   ACEMS
Page 27 of 30


## Figure 4.1.3.7 Master Sequence Diagram

This   Master   Sequence   Diagram   shows   the   complete   workflow   across   multiple   system
components—brand,  creator,  platform,  rule  engine,  decision  engine,  database,  and  notification
service. It begins with contract upload and acceptance, moves through rule evaluation and decision-
making,  and  ends  with  notifications  being sent.  By  mapping  each  interaction  step-by-step,  it
highlights how contracts, queries, and rules are processed in a structured flow to ensure accurate
validation and timely communication.


Team-id : PIET_10   ACEMS
Page 28 of 30

## CHAPER 7 CONCLUSION

Autonomous Contract Execution and Monitoring System (ACEMS) is one of the effective solutions
to addressing the problem of digital contracts between content creators and brands. Conventionally
managed  contract  processes  are  prone  to  manual  monitoring  that  might  be  time  consuming,
conflicts and lack of transparency. The proposed system automatizes the contract implementation
and  ensures  constant  monitoring  of  the  contract  events  to  ensure  that  all  the  set  terms  and
deliverables of the contract are achieved.
The  system  increase  reliability,  accountability,  and  transparency  in  the  influencer  marketing
partnerships by establishing automated checks and balances systems. It reduces the use of hands
and helps in maintaining an orderly record of the activities in the contract at the various stages of
the contract lifecycle.
Overall, ACEMS demonstrates that digital contract management systems can be enhanced with the
help of automation and intelligent monitoring since the collusion between stakeholders will be more
efficient, secure and trustworthy.
















Team-id : PIET_10   ACEMS
Page 29 of 30

## CHAPTER 8 REFERENCE
[1] S. Godboley, P. R. Krishna, S. S. Harika, and P. Varnam, “Validation framework for e-contract
and smart contract,” Proc. Int. Conf. Evaluation and Assessment in Software Engineering (EASE),
## 2025.
[2] P. S. G. Arunasri et al., “Bridging legal theory and blockchain execution: A unified framework
for smart contract automation and enforceable digital agreements,” 2024.
[3] M. Krichen, M. Lahami, and Q. Abu Al-Haija, “Formal methods for the verification of smart
contracts: A review,” IEEE Access.
[4] T. Ferariu, P. Wadler, and O. Melkonian, “Validity, liquidity, and fidelity: Formal verification
for smart contracts in Cardano,” Proc. Formal Methods for Blockchains, 2025.
[5] A. Kuhlman and A. Wicaksana, “AI generation of smart contract for decentralized autonomous
applications,” Journal of Wireless Mobile Networks, 2025.
[6]  Y.  Liu  et al.,  “PropertyGPT:  LLM-driven  formal  verification  of  smart  contracts  through
retrieval-augmented property generation,” 2024.
[7]  C.  Valencia-Payan,  D.  Griol, and J. C. Corrales, “Blockchain self-update  smart  contract  for
supply chain traceability with data validation,” 2024.
[8] S. Al Azzam et al., “AI-driven smart contract vulnerability detection: A systematic review of
methods, challenges, and future prospects,” 2025.
[9] Z. Wei et al., “Advanced smart contract vulnerability detection via LLM-powered multi-agent
systems,” IEEE Trans. Software Engineering, 2025.
[10] I. Mustafa, A. McGibney, and S. Rea, “Smart contract life-cycle management: An engineering
framework for the generation of robust and verifiable smart contracts,” Frontiers in Blockchain,
## 2024.
[11] T. M. Hewa et al., “Survey on blockchain-based smart contracts: Technical aspects and future
research,” IEEE Access, 2021.
[12] T. Górski, “Smart contract design pattern for processing logically coherent transaction types,”
## Applied Sciences, 2024.
[13] Y. Sun et al., “GPTScan: Detecting logic vulnerabilities in smart contracts by combining GPT
with program analysis,” Proc. ICSE, 2024.
[14] I. Mustafa et al., “Smart contract life-cycle management framework,” 2024.
[15]  M.  Jurgelaitis, L. Čeponienė, and R. Butkienė, “Solidity code generation from UML state
machines in model-driven smart contract development,” IEEE Access, 2022.
[16] T. Pujiati et al., “Integrating AI-driven predictive analytics and smart contracts for data-driven
supply chain risk management,” AJRI, 2025.


Team-id : PIET_10   ACEMS
Page 30 of 30

[17] R. Hofstetter, A. Lanz, and N. S. Sahni, “Contract design in influencer marketing,” 2024.
[18] J. Ahn and M. Kim, “Autonomous AI agents for multi-platform social media marketing,”
## Electronics, 2025.
[19] A. Barunaha, M. R. Prakash, and R. Naresh, “Real-time  sentiment analysis of social media
content for brand improvement and topic tracking,” 2024.
[20] Z. Wei et al., “LLM-powered multi-agent systems for smart contract vulnerability detection,”
## IEEE TSE, 2025
