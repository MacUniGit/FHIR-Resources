import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPatient } from '../apis/patient';
import { AgGridReact } from 'ag-grid-react';
import AllergyIntolerance from '../components/AllergyIntolerance';
import MedicationStatement from '../components/MedicationStatement';
import ImmunizationRecommendation from '../components/ImmunizationRecommendation';
import DeviceUseStatement from '../components/DeviceUseStatement';

import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-balham.css';
import '../stylesheets/PatientInfo.css'; // Place this import below ag-grid to overwrite it (for styling customization purpose)


/**
 * Extract the keys & values of an object and return it in a string in a tree-like structure. 
 * @param {Object} object
 * @param {string} indent
 * @returns content
 */
export const extractContent = (object, indent = '', content = '') => {
  if (object === undefined) return;
  if (typeof object === 'object') {
    Object.entries(object).forEach(([key, value]) => {
      // To avoid printing numbers as keys when object is an Array
      if (!Array.isArray(object)) {
        content += indent + key + ':';
      }
      // If this is an object of length >=1 and its value is not string
      // (Basically it's not a single simple value), add a \n
      if (Object.keys(value).length >= 1 && typeof Object.entries(value)[0][1] !== 'string') {
        content += '\n';
      }
      content = extractContent(value, indent + ' ', content);
    });
  } else {
    // console.log(indent, object)
    content += ' ' + object + '\n';
  }
  return content;
};


const convertData = (patientData) => {

  const handleTelecom = (telecom) => {
    const telecomString = [];
    if (telecom === undefined) return;
    if (telecom !== undefined) {
      telecom.forEach((element) => {
        telecomString.push(`${element.system} ${element.value} ${element.use}`);
      })
      return telecomString;
    }
  }
  const handleAddress = (address) => {
    const addressString = [];   
    if (address === undefined) return;
    if (address !== undefined) {
      address.forEach((element) => {
        Object.values(element).forEach(value => {
          if (Array.isArray(value)) {value = value.join(' ');}
          addressString.push(value)
        })
      })
      return addressString;
    }
  }
  const handleCommunication = (communication) => {
    const communicationString = [];
    if (communication === undefined) return;
    if (communication !== undefined) {
      communication.forEach((element) => {
        communicationString.push(element.language.coding[0].display);
      })
      return communicationString;
    }
  }
  const handleContact = (contact) => {
    const contactString = [];
    if (contact[0].name === undefined) return;
    if (contact[0].name !== undefined) {
      contact.forEach((element) => {
        Object.values(element.name).forEach(value => {
          if (Array.isArray(value)) {value = value.join(' ');}
          contactString.push(value)
        })
      })
      return contactString;
    }
  }
  // See patient data structure here: https://www.hl7.org/fhir/patient.html#patient
  return [
    { dataType: 'Name', value: patientData.name? patientData.name[0].given.join(' ') + ' ' + patientData.name[0].family : ''},
    { dataType: 'Active', value: patientData.active },
    { dataType: 'Telecom', value: handleTelecom(patientData.telecom) },
    { dataType: 'Gender', value: extractContent(patientData.gender) },
    { dataType: 'BirthDate', value: extractContent(patientData.birthDate) },
    { dataType: 'Deceased', value: extractContent(patientData.deceased) },
    { dataType: 'Address', value: patientData.address? handleAddress(patientData.address) : '' },
    { dataType: 'Marital Status', value: patientData.maritalStatus? extractContent(patientData.maritalStatus.coding[0].display) : '' },
    { dataType: 'Multiple Birth', value: extractContent(patientData.multipleBirth) },
    { dataType: 'Contact', value: handleContact(patientData.contact) },
    //  ? patientData.contact[0].name.given.join(' ') + ' ' + patientData.contact[0].name.family : '' },
    { dataType: 'Communication', value: patientData.communication? handleCommunication(patientData.communication) : '' },
  ];
};

const PatientInfo = () => {
  const { id } = useParams();
  const [rowData, setRowData] = useState([]);
  // ag-grid-table variables
  const gridOptions = { 
    defaultColDef:{
      filter: true,
      resizable: true,
      wrapText: true,
      autoHeight: true,
      autoWidth: true,
      editable: true,
      // suppressSizeToFit: true,
    },
    columnDefs: [
      { headerName: 'Data type', field: 'dataType', maxWidth: 200 },
      { headerName: 'Value', field: 'value' },
    ],
    domLayout: 'autoHeight',  // https://www.ag-grid.com/javascript-data-grid/grid-size/
    onGridReady: (params) => params.api.sizeColumnsToFit(),
  }

  useEffect(() => {
    getPatient(id).then((response) => {
      console.log('Patient:', response);
      const data = convertData(response);
      setRowData(data);
    });
  }, [id]);

  return (
    <div>
      <h3>Patient ID ⟨ {id} ⟩</h3>
      <div className="ag-theme-balham-dark" style={{width: '60vw'}}>
        <AgGridReact
          gridOptions={gridOptions}
          rowData={rowData}
        />
      </div>

      <h4>Allergy Intolerance</h4>
      <AllergyIntolerance patientId={id} />
      <h4>Medication Statement</h4>
      <MedicationStatement patientId={id} />
      <h4>Immunization Recommendation</h4>
      <ImmunizationRecommendation patientId={id} />
      <h4>Device Use Statement</h4>
      <DeviceUseStatement patientId={id} />
    </div>
  );
};

export default PatientInfo;
