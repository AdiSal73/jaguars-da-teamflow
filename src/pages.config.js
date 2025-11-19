import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import BookSession from './pages/BookSession';
import Teams from './pages/Teams';
import Assessments from './pages/Assessments';
import TeamDashboard from './pages/TeamDashboard';
import ClubManagement from './pages/ClubManagement';
import TrainingPlans from './pages/TrainingPlans';
import TrainingPlanDetail from './pages/TrainingPlanDetail';
import Messages from './pages/Messages';
import UnassignedRecords from './pages/UnassignedRecords';
import CoachManagement from './pages/CoachManagement';
import Availability from './pages/Availability';
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';
import PublicBooking from './pages/PublicBooking';
import PlayerAssessmentAnalytics from './pages/PlayerAssessmentAnalytics';
import BookingsTable from './pages/BookingsTable';
import CoachDashboard from './pages/CoachDashboard';
import TeamCalendar from './pages/TeamCalendar';
import TeamCommunication from './pages/TeamCommunication';
import TeamDrills from './pages/TeamDrills';
import MyBookings from './pages/MyBookings';
import BulkEmail from './pages/BulkEmail';
import Tryouts from './pages/Tryouts';
import TeamsTable from './pages/TeamsTable';
import EvaluationsNew from './pages/EvaluationsNew';
import FormationView from './pages/FormationView';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Players": Players,
    "PlayerProfile": PlayerProfile,
    "BookSession": BookSession,
    "Teams": Teams,
    "Assessments": Assessments,
    "TeamDashboard": TeamDashboard,
    "ClubManagement": ClubManagement,
    "TrainingPlans": TrainingPlans,
    "TrainingPlanDetail": TrainingPlanDetail,
    "Messages": Messages,
    "UnassignedRecords": UnassignedRecords,
    "CoachManagement": CoachManagement,
    "Availability": Availability,
    "UserManagement": UserManagement,
    "Analytics": Analytics,
    "PublicBooking": PublicBooking,
    "PlayerAssessmentAnalytics": PlayerAssessmentAnalytics,
    "BookingsTable": BookingsTable,
    "CoachDashboard": CoachDashboard,
    "TeamCalendar": TeamCalendar,
    "TeamCommunication": TeamCommunication,
    "TeamDrills": TeamDrills,
    "MyBookings": MyBookings,
    "BulkEmail": BulkEmail,
    "Tryouts": Tryouts,
    "TeamsTable": TeamsTable,
    "EvaluationsNew": EvaluationsNew,
    "FormationView": FormationView,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};