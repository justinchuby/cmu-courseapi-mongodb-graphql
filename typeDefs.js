import { gql } from 'apollo-server-express'

// The GraphQL schema
export const typeDefs = gql`
  scalar Date

  type Course {
    courseId: String!
    desc: String
    name: String
    notes: String
    department: String
    coreqs: String
    coreqsObj: Requisite
    prereqs: String
    prereqsObj: Requisite
    semester: String
    year: Int
    units: Int
    rundate: Date
  }

  type Meeting {
    courseId: String!
    name: String
    times: [EventTime]
    instructors: [String]
    type: String
    semester: String
    year: Int
    rundate: Date
  }

  type EventTime {
    days: [Int]
    begin: Int
    end: Int
    building: String
    room: String
    location: String
  }

  type Requisite {
    reqs: [[String]]
    invert: Boolean
  }

  type Query {
    courses: [Course]
  }
`