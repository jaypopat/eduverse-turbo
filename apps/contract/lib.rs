#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod eduverse {
    use ink::env::hash::CryptoHash;
    use ink::prelude::string::String;
    use ink::prelude::string::ToString;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;
    use psp34::PSP34Error;
    use psp34::{Id, PSP34Data};

    ////////////////////////////////////
    ////////// MODELS /////////////////
    //////////////////////////////////
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(
        feature = "std",
        derive(ink::storage::traits::StorageLayout, Debug, PartialEq, Eq)
    )]
    #[derive(Clone)]
    pub struct Course {
        pub id: u32,
        pub teacher: AccountId,
        pub title: String,
        pub description: String,
        pub max_students: u32,
        pub enrolled_count: u32,
        pub start_time: Timestamp,
        pub end_time: Timestamp,
        pub price: Balance,
        pub active: bool,
        pub metadata_hash: String,
        pub created_at: Timestamp,
    }

    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(
        feature = "std",
        derive(ink::storage::traits::StorageLayout, Debug, PartialEq, Eq)
    )]
    #[derive(Clone)]
    pub struct CertificateInfo {
        pub course_id: u32,
        pub course_title: String,
        pub student: AccountId,
        pub completion_date: Timestamp,
    }

    ////////////////////////////////////
    ////////// EVENTS /////////////////
    //////////////////////////////////

    #[ink(event)]
    pub struct CourseCreated {
        #[ink(topic)]
        pub course_id: u32,
        #[ink(topic)]
        pub teacher: AccountId,
        pub title: String,
    }

    #[ink(event)]
    pub struct StudentEnrolled {
        #[ink(topic)]
        pub course_id: u32,
        #[ink(topic)]
        pub student: AccountId,
        pub payment: Balance,
    }

    #[ink(event)]
    pub struct CourseCompleted {
        #[ink(topic)]
        pub course_id: u32,
        #[ink(topic)]
        pub student: AccountId,
        pub certificate_id: psp34::Id,
    }

    #[ink(event)]
    pub struct CourseUpdated {
        #[ink(topic)]
        pub course_id: u32,
        #[ink(topic)]
        pub teacher: AccountId,
    }

    #[ink(event)]
    pub struct PSP34Transfer {
        #[ink(topic)]
        pub from: Option<AccountId>,
        #[ink(topic)]
        pub to: Option<AccountId>,
        #[ink(topic)]
        pub id: Id,
    }

    #[ink(event)]
    pub struct PSP34Approval {
        #[ink(topic)]
        pub owner: AccountId,
        #[ink(topic)]
        pub operator: AccountId,
        #[ink(topic)]
        pub id: Option<Id>,
        pub approved: bool,
    }

    #[ink(event)]
    pub struct PSP34AttributeSet {
        #[ink(topic)]
        pub id: Id,
        pub key: Vec<u8>,
        pub data: Vec<u8>,
    }

    ////////////////////////////////////
    ////////// ERRORS /////////////////
    //////////////////////////////////
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        CourseNotActive,
        NotOwner,
        NotTeacher,
        NotStudent,
        CourseNotFound,
        CourseInactive,
        CourseFull,
        CourseNotStarted,
        CourseEnded,
        AlreadyEnrolled,
        NotEnrolled,
        InsufficientPayment,
        InvalidInput,
        InvalidTime,
        AlreadyCompleted,
        CertificateNotFound,
        TransferError,
        PSP34Error(PSP34Error),
        CourseIsFull,
        CourseInProgress,
        Unauthorized,
        NFTMintingFailed,
        PaymentFailed,
        RefundPeriodEnded,
        InvalidFeePercentage,
        NoRefundAvailable,
    }

    #[ink(storage)]
    pub struct Eduverse {
        /// Course counter for generating course IDs
        course_counter: u32,
        /// Mapping of course ID to course details
        courses: Mapping<u32, Course>,
        /// Mapping of student address to their enrollments
        student_enrollments: Mapping<AccountId, Vec<u32>>,
        /// Mapping of teacher address to their courses
        teacher_courses: Mapping<AccountId, Vec<u32>>,
        /// Mapping of course ID to enrolled students
        course_students: Mapping<u32, Vec<AccountId>>,
        /// Mapping of course ID and student to completion status
        course_completions: Mapping<(u32, AccountId), bool>,
        /// Contract owner
        owner: AccountId,

        // NFT functionality
        data: PSP34Data,
        certificate_info: Mapping<Id, CertificateInfo>,
        // Custom metadata storage
        attributes: Mapping<(psp34::Id, Vec<u8>), Vec<u8>>,
        // Track certificates by student
        student_certificates: Mapping<AccountId, Vec<psp34::Id>>,
    }

    impl Default for Eduverse {
        fn default() -> Self {
            Self::new()
        }
    }
    ////////////////////////////////////
    ////////// CONTRACT METHODS ////////
    //////////////////////////////////
    impl Eduverse {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                course_counter: 0,
                courses: Mapping::default(),
                student_enrollments: Mapping::default(),
                teacher_courses: Mapping::default(),
                course_students: Mapping::default(),
                course_completions: Mapping::default(),
                owner: Self::env().caller(),
                data: PSP34Data::new(),
                certificate_info: Mapping::default(),
                attributes: Mapping::default(),
                student_certificates: Mapping::default(),
            }
        }

        #[ink(message)]
        pub fn create_course(
            &mut self,
            title: String,
            description: String,
            max_students: u32,
            start_time: Timestamp,
            end_time: Timestamp,
            price: Balance,
            metadata_hash: String,
        ) -> Result<u32, Error> {
            let caller = self.env().caller();
            let current_time = self.env().block_timestamp();

            // Input validation
            if title.len() > 100 || description.len() > 1000 {
                return Err(Error::InvalidInput);
            }

            // Validate times
            if start_time <= current_time || end_time <= start_time {
                return Err(Error::InvalidTime);
            }

            // Validate refund deadline if refundable

            let course_id = self.course_counter;
            self.course_counter = self
                .course_counter
                .checked_add(1)
                .unwrap_or(self.course_counter);

            let course = Course {
                id: course_id,
                teacher: caller,
                title: title.clone(),
                description,
                max_students,
                enrolled_count: 0,
                start_time,
                end_time,
                price,
                active: true,
                metadata_hash,
                created_at: current_time,
            };

            // Store course
            self.courses.insert(course_id, &course);

            // Add to teacher's courses
            let mut teacher_courses = self.teacher_courses.get(caller).unwrap_or_default();
            teacher_courses.push(course_id);
            self.teacher_courses.insert(caller, &teacher_courses);

            // Emit event
            self.env().emit_event(CourseCreated {
                course_id,
                teacher: caller,
                title,
            });

            Ok(course_id)
        }

        #[ink(message)]
        pub fn update_course(
            &mut self,
            course_id: u32,
            title: Option<String>,
            description: Option<String>,
            max_students: Option<u32>,
            price: Option<Balance>,
            active: Option<bool>,
            metadata_hash: Option<String>,
        ) -> Result<(), Error> {
            let caller = self.env().caller();
            let mut course = self.courses.get(course_id).ok_or(Error::CourseNotFound)?;

            // Only teacher can update
            if caller != course.teacher {
                return Err(Error::Unauthorized);
            }

            // Cannot update if course has started
            let current_time = self.env().block_timestamp();
            if current_time >= course.start_time {
                return Err(Error::CourseInProgress);
            }

            // Update fields if provided
            if let Some(new_title) = title {
                if new_title.len() > 100 {
                    return Err(Error::InvalidInput);
                }
                course.title = new_title;
            }

            if let Some(new_description) = description {
                if new_description.len() > 1000 {
                    return Err(Error::InvalidInput);
                }
                course.description = new_description;
            }

            if let Some(new_max) = max_students {
                // Cannot reduce max students below current enrollment
                if new_max < course.enrolled_count {
                    return Err(Error::InvalidInput);
                }
                course.max_students = new_max;
            }

            if let Some(new_price) = price {
                course.price = new_price;
            }

            if let Some(new_active) = active {
                course.active = new_active;
            }

            if let Some(new_hash) = metadata_hash {
                course.metadata_hash = new_hash;
            }

            // Save updated course
            self.courses.insert(course_id, &course);

            // Emit event
            self.env().emit_event(CourseUpdated {
                course_id,
                teacher: caller,
            });

            Ok(())
        }

        #[ink(message, payable)]
        pub fn enroll(&mut self, course_id: u32) -> Result<(), Error> {
            let caller = self.env().caller();
            let course = self.courses.get(course_id).ok_or(Error::CourseNotFound)?;
            let current_time = self.env().block_timestamp();

            // Validations
            if !course.active {
                return Err(Error::CourseNotActive);
            }

            if current_time >= course.start_time {
                return Err(Error::CourseInProgress);
            }

            if course.enrolled_count >= course.max_students {
                return Err(Error::CourseIsFull);
            }

            if self.verify_enrollment(caller, course_id) {
                return Err(Error::AlreadyEnrolled);
            }

            if self.env().transferred_value() < course.price {
                return Err(Error::InsufficientPayment);
            }
            // Transfer payment to teacher
            if self.env().transfer(course.teacher, course.price).is_err() {
                return Err(Error::PaymentFailed);
            }

            // Update enrollments
            let mut student_courses = self.student_enrollments.get(caller).unwrap_or_default();
            student_courses.push(course_id);
            self.student_enrollments.insert(caller, &student_courses);

            // Update course students
            let mut course_students = self.course_students.get(course_id).unwrap_or_default();
            course_students.push(caller);
            self.course_students.insert(course_id, &course_students);

            // Update course enrolled count
            let mut updated_course = course.clone();
            updated_course.enrolled_count = updated_course
                .enrolled_count
                .checked_add(1)
                .unwrap_or(updated_course.enrolled_count);
            self.courses.insert(course_id, &updated_course);

            // Emit event
            self.env().emit_event(StudentEnrolled {
                course_id,
                student: caller,
                payment: course.price,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn complete_course(&mut self, course_id: u32, student: AccountId) -> Result<(), Error> {
            let caller = self.env().caller();
            let course = self.courses.get(course_id).ok_or(Error::CourseNotFound)?;
            let current_time = self.env().block_timestamp();

            // Only teacher can mark completion
            if caller != course.teacher {
                return Err(Error::Unauthorized);
            }

            // Check if student is enrolled
            if !self.verify_enrollment(student, course_id) {
                return Err(Error::NotEnrolled);
            }

            // Check if course has ended
            if current_time < course.end_time {
                return Err(Error::CourseInProgress);
            }

            // Mark as completed
            self.course_completions.insert((course_id, student), &true);

            // Generate a unique ID for the certificate NFT
            // Use hash of student ID and course ID for uniqueness
            use ink::env::hash;

            let mut input = Vec::new();
            input.extend_from_slice(&course_id.to_be_bytes());
            input.extend_from_slice(student.as_ref());
            input.extend_from_slice(&current_time.to_be_bytes());

            let mut certificate_hash = [0u8; 16]; // 16 bytes for blake2_128
            hash::Blake2x128::hash(&input, &mut certificate_hash);

            let certificate_id = psp34::Id::U128(u128::from_be_bytes(certificate_hash));

            // Create certificate info
            let certificate = CertificateInfo {
                course_id,
                course_title: course.title.clone(),
                student,
                completion_date: current_time,
            };

            // Mint NFT certificate
            match self.mint_certificate(student, certificate_id.clone(), certificate) {
                Ok(_) => {
                    // Emit completion event
                    self.env().emit_event(CourseCompleted {
                        course_id,
                        student,
                        certificate_id,
                    });
                    Ok(())
                }
                Err(_) => Err(Error::NFTMintingFailed),
            }
        }

        // Helper function to mint certificate
        fn mint_certificate(
            &mut self,
            to: AccountId,
            id: psp34::Id,
            certificate: CertificateInfo,
        ) -> Result<(), Error> {
            // Mint the token
            let events = self
                .data
                .mint(to, id.clone())
                .map_err(|_| Error::NFTMintingFailed)?;

            // Store certificate info
            self.certificate_info.insert(id.clone(), &certificate);

            // Store metadata attributes in our custom mapping
            self.attributes.insert(
                (id.clone(), String::from("course_title").into_bytes()),
                &certificate.course_title.into_bytes(),
            );

            self.attributes.insert(
                (id.clone(), String::from("course_id").into_bytes()),
                &certificate.course_id.to_string().into_bytes(),
            );

            self.attributes.insert(
                (id.clone(), String::from("completion_date").into_bytes()),
                &certificate.completion_date.to_string().into_bytes(),
            );

            // Add to student's certificates
            let mut student_certs = self.student_certificates.get(to).unwrap_or_default();
            student_certs.push(id.clone());
            self.student_certificates.insert(to, &student_certs);

            for event in events {
                match event {
                    psp34::PSP34Event::Transfer { from, to, id } => {
                        self.env().emit_event(PSP34Transfer { from, to, id });
                    }
                    psp34::PSP34Event::Approval {
                        owner,
                        operator,
                        id,
                        approved,
                    } => {
                        self.env().emit_event(PSP34Approval {
                            owner,
                            operator,
                            id,
                            approved,
                        });
                    }
                    psp34::PSP34Event::AttributeSet { id, key, data } => {
                        self.env().emit_event(PSP34AttributeSet { id, key, data });
                    }
                }
            }

            Ok(())
        }

        ////////////////////////////////////
        ////////// HELPER/VIEW FUNCTIONS ////
        //////////////////////////////////
        #[ink(message)]
        pub fn verify_enrollment(&self, student: AccountId, course_id: u32) -> bool {
            if let Some(enrolled_students) = self.course_students.get(course_id) {
                enrolled_students.contains(&student)
            } else {
                false
            }
        }

        #[ink(message)]
        pub fn verify_completion(&self, student: AccountId, course_id: u32) -> bool {
            self.course_completions
                .get((course_id, student))
                .unwrap_or(false)
        }

        #[ink(message)]
        pub fn get_course(&self, course_id: u32) -> Option<Course> {
            self.courses.get(course_id)
        }

        #[ink(message)]
        pub fn get_student_courses(&self, student: AccountId) -> Vec<u32> {
            self.student_enrollments.get(student).unwrap_or_default()
        }
        // Add a method to get certificate attributes
        #[ink(message)]
        pub fn get_certificate_attribute(&self, id: psp34::Id, key: Vec<u8>) -> Option<Vec<u8>> {
            self.attributes.get((id, key))
        }
        #[ink(message)]
        pub fn get_student_certificate_vector(&self, student: AccountId) -> Vec<psp34::Id> {
            self.student_certificates.get(student).unwrap_or_default()
        }

        #[ink(message)]
        pub fn get_teacher_courses(&self, teacher: AccountId) -> Vec<u32> {
            self.teacher_courses.get(teacher).unwrap_or_default()
        }

        #[ink(message)]
        pub fn get_course_students(&self, course_id: u32) -> Vec<AccountId> {
            self.course_students.get(course_id).unwrap_or_default()
        }

        #[ink(message)]
        pub fn get_courses(&self) -> Vec<Course> {
            let mut courses_vec = Vec::new();
            for course_id in 0..self.course_counter {
                if let Some(course) = self.courses.get(course_id) {
                    courses_vec.push(course);
                }
            }
            courses_vec
        }
        #[ink(message)]
        pub fn verify_certificate(&self, id: psp34::Id) -> Result<CertificateInfo, Error> {
            self.certificate_info.get(id).ok_or(Error::NFTMintingFailed)
        }
    }
    ////////////////////////////////////
    ////////// PSP34 TRAIT IMPLS ///////
    //////////////////////////////////
    impl psp34::PSP34 for Eduverse {
        #[ink(message)]
        fn collection_id(&self) -> Id {
            Id::U8(0)
        }

        #[ink(message)]
        fn balance_of(&self, owner: AccountId) -> u32 {
            self.data.balance_of(owner)
        }

        #[ink(message)]
        fn owner_of(&self, id: Id) -> Option<AccountId> {
            self.data.owner_of(&id)
        }

        #[ink(message)]
        fn allowance(&self, owner: AccountId, operator: AccountId, id: Option<Id>) -> bool {
            self.data.allowance(owner, operator, id.as_ref())
        }

        #[ink(message)]
        fn approve(
            &mut self,
            operator: AccountId,
            id: Option<Id>,
            approved: bool,
        ) -> Result<(), PSP34Error> {
            let _events = self
                .data
                .approve(self.env().caller(), operator, id, approved)?;
            // Handle events
            Ok(())
        }

        #[ink(message)]
        fn transfer(&mut self, _to: AccountId, _id: Id, _data: Vec<u8>) -> Result<(), PSP34Error> {
            // Prevent transfers to maintain certificate integrity
            return Err(PSP34Error::Custom(String::from(
                "Certificates cannot be transferred",
            )));
        }

        #[ink(message)]
        fn total_supply(&self) -> u128 {
            self.data.total_supply()
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use eduverse::Eduverse;
    use ink::env::{test, DefaultEnvironment};
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use psp34::{PSP34Error, PSP34};

    const COURSE_TITLE: &str = "Test Course";
    const COURSE_DESC: &str = "This is a test course.";
    const METADATA_HASH: &str = "hash123";
    const MAX_STUDENTS: u32 = 10;
    const PRICE: u128 = 100;

    /// Helper to generate a string of a given length.
    fn generate_string(len: usize) -> String {
        "a".repeat(len)
    }

    /// Test creating a course with an invalid title length (more than 100 characters).
    #[ink::test]
    fn test_create_course_invalid_title() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        test::set_block_timestamp::<DefaultEnvironment>(1000);

        let mut contract = Eduverse::new();

        let invalid_title = generate_string(101); // 101 characters
        let description = String::from(COURSE_DESC);
        let start_time = 2000;
        let end_time = 3000;
        let price = PRICE;
        let metadata_hash = String::from(METADATA_HASH);

        let result = contract.create_course(
            invalid_title,
            description,
            MAX_STUDENTS,
            start_time,
            end_time,
            price,
            metadata_hash,
        );
        assert_eq!(result, Err(eduverse::Error::InvalidInput));
    }

    /// Test creating a course with an invalid description length (more than 1000 characters).
    #[ink::test]
    fn test_create_course_invalid_description() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        test::set_block_timestamp::<DefaultEnvironment>(1000);

        let mut contract = Eduverse::new();

        let title = String::from(COURSE_TITLE);
        let invalid_description = generate_string(1001); // 1001 characters
        let start_time = 2000;
        let end_time = 3000;
        let price = PRICE;
        let metadata_hash = String::from(METADATA_HASH);

        let result = contract.create_course(
            title,
            invalid_description,
            MAX_STUDENTS,
            start_time,
            end_time,
            price,
            metadata_hash,
        );
        assert_eq!(result, Err(eduverse::Error::InvalidInput));
    }

    /// Test creating a course with invalid timing (start_time in the past).
    #[ink::test]
    fn test_create_course_invalid_time_start() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        // current block time is 1000
        test::set_block_timestamp::<DefaultEnvironment>(1000);

        let mut contract = Eduverse::new();

        let title = String::from(COURSE_TITLE);
        let description = String::from(COURSE_DESC);
        let start_time = 500; // Invalid: before current time
        let end_time = 3000;
        let price = PRICE;
        let metadata_hash = String::from(METADATA_HASH);

        let result = contract.create_course(
            title,
            description,
            MAX_STUDENTS,
            start_time,
            end_time,
            price,
            metadata_hash,
        );
        assert_eq!(result, Err(eduverse::Error::InvalidTime));
    }

    /// Test creating a course with invalid timing (end_time <= start_time).
    #[ink::test]
    fn test_create_course_invalid_time_end() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        // current block time is 1000
        test::set_block_timestamp::<DefaultEnvironment>(1000);

        let mut contract = Eduverse::new();

        let title = String::from(COURSE_TITLE);
        let description = String::from(COURSE_DESC);
        let start_time = 2000;
        let end_time = 1500; // Invalid: end_time before start_time
        let price = PRICE;
        let metadata_hash = String::from(METADATA_HASH);

        let result = contract.create_course(
            title,
            description,
            MAX_STUDENTS,
            start_time,
            end_time,
            price,
            metadata_hash,
        );
        assert_eq!(result, Err(eduverse::Error::InvalidTime));
    }

    /// Test enrolling a student with insufficient payment.
    #[ink::test]
    fn test_enroll_insufficient_payment() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        // Create course as Alice.
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        test::set_block_timestamp::<DefaultEnvironment>(1000);
        let mut contract = Eduverse::new();

        let title = String::from("Insufficient Payment Course");
        let description = String::from("Test insufficient payment.");
        let start_time = 2000;
        let end_time = 3000;
        let price = PRICE;
        let metadata_hash = String::from("insuff_hash");

        let course_id = contract
            .create_course(
                title,
                description,
                MAX_STUDENTS,
                start_time,
                end_time,
                price,
                metadata_hash,
            )
            .expect("Course creation should succeed");

        // Bob attempts to enroll with insufficient funds.
        test::set_caller::<DefaultEnvironment>(accounts.bob);
        // Transferred value less than price.
        test::set_value_transferred::<DefaultEnvironment>(PRICE - 1);
        test::set_block_timestamp::<DefaultEnvironment>(1500);

        let enroll_result = contract.enroll(course_id);
        assert_eq!(enroll_result, Err(eduverse::Error::InsufficientPayment));
    }

    /// Test enrolling a student when the course is not active.
    #[ink::test]
    fn test_enroll_course_not_active() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        // Create a course as Alice.
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        test::set_block_timestamp::<DefaultEnvironment>(1000);
        let mut contract = Eduverse::new();

        let title = String::from("Inactive Course");
        let description = String::from("Test course inactive.");
        let start_time = 2000;
        let end_time = 3000;
        let price = PRICE;
        let metadata_hash = String::from("inactive_hash");

        let course_id = contract
            .create_course(
                title,
                description,
                MAX_STUDENTS,
                start_time,
                end_time,
                price,
                metadata_hash,
            )
            .expect("Course creation should succeed");

        // Update the course to set active = false.
        let update_result =
            contract.update_course(course_id, None, None, None, None, Some(false), None);
        assert!(update_result.is_ok());

        // Bob attempts to enroll.
        test::set_caller::<DefaultEnvironment>(accounts.bob);
        test::set_value_transferred::<DefaultEnvironment>(price);
        test::set_block_timestamp::<DefaultEnvironment>(1500);

        let enroll_result = contract.enroll(course_id);
        assert_eq!(enroll_result, Err(eduverse::Error::CourseNotActive));
    }

    /// Test enrolling a student when the course is already in progress.
    #[ink::test]
    fn test_enroll_course_in_progress() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        // Create a course as Alice.
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        test::set_block_timestamp::<DefaultEnvironment>(1000);
        let mut contract = Eduverse::new();

        let title = String::from("In Progress Course");
        let description = String::from("Test course in progress.");
        let start_time = 2000;
        let end_time = 3000;
        let price = PRICE;
        let metadata_hash = String::from("inprog_hash");

        let course_id = contract
            .create_course(
                title,
                description,
                MAX_STUDENTS,
                start_time,
                end_time,
                price,
                metadata_hash,
            )
            .expect("Course creation should succeed");

        // Bob attempts to enroll after the course has started.
        test::set_caller::<DefaultEnvironment>(accounts.bob);
        test::set_value_transferred::<DefaultEnvironment>(price);
        test::set_block_timestamp::<DefaultEnvironment>(2100); // after start_time

        let enroll_result = contract.enroll(course_id);
        assert_eq!(enroll_result, Err(eduverse::Error::CourseInProgress));
    }

    /// Test enrolling a student who is already enrolled.
    #[ink::test]
    fn test_already_enrolled() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        // Create a course as Alice.
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        test::set_block_timestamp::<DefaultEnvironment>(1000);
        let mut contract = Eduverse::new();

        let title = String::from("Double Enrollment Course");
        let description = String::from("Test already enrolled.");
        let start_time = 2000;
        let end_time = 3000;
        let price = PRICE;
        let metadata_hash = String::from("double_hash");

        let course_id = contract
            .create_course(
                title,
                description,
                2, // allow 2 students
                start_time,
                end_time,
                price,
                metadata_hash,
            )
            .expect("Course creation should succeed");

        // Bob enrolls successfully.
        test::set_caller::<DefaultEnvironment>(accounts.bob);
        test::set_value_transferred::<DefaultEnvironment>(price);
        test::set_block_timestamp::<DefaultEnvironment>(1500);
        let enroll_result = contract.enroll(course_id);
        assert!(enroll_result.is_ok());

        // Bob tries to enroll again.
        test::set_value_transferred::<DefaultEnvironment>(price);
        let second_enroll = contract.enroll(course_id);
        assert_eq!(second_enroll, Err(eduverse::Error::AlreadyEnrolled));
    }

    /// Test enrolling a student when the course is full.
    #[ink::test]
    fn test_course_full() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        // Create a course as Alice with max_students = 1.
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        test::set_block_timestamp::<DefaultEnvironment>(1000);
        let mut contract = Eduverse::new();

        let title = String::from("Full Course");
        let description = String::from("Test course full.");
        let start_time = 2000;
        let end_time = 3000;
        let price = PRICE;
        let metadata_hash = String::from("full_hash");

        let course_id = contract
            .create_course(
                title,
                description,
                1, // only one student allowed
                start_time,
                end_time,
                price,
                metadata_hash,
            )
            .expect("Course creation should succeed");

        // Bob enrolls successfully.
        test::set_caller::<DefaultEnvironment>(accounts.bob);
        test::set_value_transferred::<DefaultEnvironment>(price);
        test::set_block_timestamp::<DefaultEnvironment>(1500);
        let enroll_result = contract.enroll(course_id);
        assert!(enroll_result.is_ok());

        // Charlie attempts to enroll and should fail.
        test::set_caller::<DefaultEnvironment>(accounts.charlie);
        test::set_value_transferred::<DefaultEnvironment>(price);
        let enroll_result_charlie = contract.enroll(course_id);
        assert_eq!(enroll_result_charlie, Err(eduverse::Error::CourseIsFull));
    }

    /// Test updating a course after it has already started.
    #[ink::test]
    fn test_update_course_after_start() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        // Create a course as Alice.
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        test::set_block_timestamp::<DefaultEnvironment>(1000);
        let mut contract = Eduverse::new();

        let title = String::from("Update Timing Course");
        let description = String::from("Test update after start.");
        let start_time = 2000;
        let end_time = 3000;
        let price = PRICE;
        let metadata_hash = String::from("update_hash");

        let course_id = contract
            .create_course(
                title,
                description,
                MAX_STUDENTS,
                start_time,
                end_time,
                price,
                metadata_hash,
            )
            .expect("Course creation should succeed");

        // Advance time past the start time.
        test::set_block_timestamp::<DefaultEnvironment>(2100);

        // Attempt to update the course.
        let update_result = contract.update_course(
            course_id,
            Some(String::from("New Title")),
            None,
            None,
            None,
            None,
            None,
        );
        assert_eq!(update_result, Err(eduverse::Error::CourseInProgress));
    }

    /// Test completing a course by someone who is not the teacher.
    #[ink::test]
    fn test_complete_course_non_teacher() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        // Create a course as Alice.
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        test::set_block_timestamp::<DefaultEnvironment>(1000);
        let mut contract = Eduverse::new();

        let title = String::from("Non-Teacher Completion Course");
        let description = String::from("Test complete course by non-teacher.");
        let start_time = 2000;
        let end_time = 3000;
        let price = PRICE;
        let metadata_hash = String::from("nonteacher_hash");

        let course_id = contract
            .create_course(
                title,
                description,
                MAX_STUDENTS,
                start_time,
                end_time,
                price,
                metadata_hash,
            )
            .expect("Course creation should succeed");

        // Bob enrolls.
        test::set_caller::<DefaultEnvironment>(accounts.bob);
        test::set_value_transferred::<DefaultEnvironment>(price);
        test::set_block_timestamp::<DefaultEnvironment>(1500);
        let enroll_result = contract.enroll(course_id);
        assert!(enroll_result.is_ok());

        // Advance time past the end time.
        test::set_block_timestamp::<DefaultEnvironment>(3500);

        // Bob (not the teacher) attempts to mark the course complete.
        test::set_caller::<DefaultEnvironment>(accounts.bob);
        let complete_result = contract.complete_course(course_id, accounts.bob);
        assert_eq!(complete_result, Err(eduverse::Error::Unauthorized));
    }

    /// Test completing a course before the course has ended.
    #[ink::test]
    fn test_complete_course_before_end() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        // Create a course as Alice.
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        test::set_block_timestamp::<DefaultEnvironment>(1000);
        let mut contract = Eduverse::new();

        let title = String::from("Early Completion Course");
        let description = String::from("Test complete course too early.");
        let start_time = 2000;
        let end_time = 3000;
        let price = PRICE;
        let metadata_hash = String::from("early_hash");

        let course_id = contract
            .create_course(
                title,
                description,
                MAX_STUDENTS,
                start_time,
                end_time,
                price,
                metadata_hash,
            )
            .expect("Course creation should succeed");

        // Bob enrolls.
        test::set_caller::<DefaultEnvironment>(accounts.bob);
        test::set_value_transferred::<DefaultEnvironment>(price);
        test::set_block_timestamp::<DefaultEnvironment>(1500);
        let enroll_result = contract.enroll(course_id);
        assert!(enroll_result.is_ok());

        // Advance time to between start and end.
        test::set_block_timestamp::<DefaultEnvironment>(2500);

        // Teacher attempts to complete the course too early.
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        let complete_result = contract.complete_course(course_id, accounts.bob);
        assert_eq!(complete_result, Err(eduverse::Error::CourseInProgress));
    }

    /// Test that NFT transfers are rejected.
    #[ink::test]
    fn test_transfer_rejection() {
        let accounts = test::default_accounts::<DefaultEnvironment>();
        // Create a course and complete it to mint an NFT.
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        test::set_block_timestamp::<DefaultEnvironment>(1000);
        let mut contract = Eduverse::new();

        let title = String::from("Transfer Test Course");
        let description = String::from("Test NFT transfer rejection.");
        let start_time = 2000;
        let end_time = 3000;
        let price = PRICE;
        let metadata_hash = String::from("transfer_hash");

        let course_id = contract
            .create_course(
                title,
                description,
                MAX_STUDENTS,
                start_time,
                end_time,
                price,
                metadata_hash,
            )
            .expect("Course creation should succeed");

        // Bob enrolls.
        test::set_caller::<DefaultEnvironment>(accounts.bob);
        test::set_value_transferred::<DefaultEnvironment>(price);
        test::set_block_timestamp::<DefaultEnvironment>(1500);
        let enroll_result = contract.enroll(course_id);
        assert!(enroll_result.is_ok());

        // Advance time past course end.
        test::set_block_timestamp::<DefaultEnvironment>(3500);

        // Teacher completes the course, minting the NFT.
        test::set_caller::<DefaultEnvironment>(accounts.alice);
        let complete_result = contract.complete_course(course_id, accounts.bob);
        assert!(complete_result.is_ok());

        // Try transferring the NFT (should be rejected).
        let bob_certs = contract.get_student_certificate_vector(accounts.bob);
        assert!(!bob_certs.is_empty());
        let certificate_id = bob_certs[0].clone();
        // Attempt to transfer from Bob to Charlie.
        test::set_caller::<DefaultEnvironment>(accounts.bob);
        let transfer_result = contract.transfer(accounts.charlie, certificate_id, Vec::new());
        match transfer_result {
            Err(PSP34Error::Custom(ref msg)) => {
                assert_eq!(msg, "Certificates cannot be transferred");
            }
            _ => panic!("Transfer should be rejected"),
        }
    }
}
