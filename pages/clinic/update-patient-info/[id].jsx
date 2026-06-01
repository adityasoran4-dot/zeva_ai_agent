import ClinicLayout from '../../../components/ClinicLayout';
import withClinicAuth from '../../../components/withClinicAuth';
import PatientUpdateForm from '../../../components/patient/PatientUpdateForm';

const UpdatePatientInfoPage = () => {
  return <PatientUpdateForm />;
};

UpdatePatientInfoPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedDashboard = withClinicAuth(UpdatePatientInfoPage);
ProtectedDashboard.getLayout = UpdatePatientInfoPage.getLayout;

export default ProtectedDashboard;

