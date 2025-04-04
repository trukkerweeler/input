
const express = require('express');
const router = express.Router();
const mysql = require('mysql');


// ==================================================
// Get all records
router.get('/', (req, res) => {
    // console.log('Fetching all records');
    try {
        const connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            port: 3306,
            database: 'quality'
        });
        connection.connect(function(err) {
            if (err) {
                console.error('Error connecting: ' + err.stack);
                return;
            }
        // console.log('Connected to DB');

        // const query = `select pi.INPUT_ID
        // , pi.INPUT_DATE
        // , pi.SUBJECT
        // , pi.ASSIGNED_TO
        // , pi.PROJECT_ID
        // , pit.INPUT_TEXT
        // , pi.DUE_DATE
        // , pi.CLOSED
        // , pi.CLOSED_DATE 
        // from PEOPLE_INPUT pi left join PPL_INPT_TEXT pit on pi.INPUT_ID = pit.INPUT_ID 
        // where CLOSED != 'Y' and pi.INPUT_DATE <= CURDATE() 
        // order by pi.INPUT_ID desc`;
        // // where USER_DEFINED_1 = 'MR'

        const query = `SELECT 'PEOPLE_INPUT' AS source_table, PEOPLE_INPUT.INPUT_ID AS record_id, ASSIGNED_TO, INPUT_DATE, DUE_DATE AS DATE_DUE, 'INPUT' AS RECORD_TYPE, pit.INPUT_TEXT AS TODO_TEXT
            FROM PEOPLE_INPUT left join PPL_INPT_TEXT pit on PEOPLE_INPUT.INPUT_ID = pit.INPUT_ID
            WHERE (CLOSED <> 'Y' OR CLOSED IS NULL) AND (DUE_DATE <= CURDATE() OR DUE_DATE IS NULL)
            
            UNION ALL
            
            SELECT 'DOCM_CHNG_RQST' AS source_table, dcr.REQUEST_ID AS record_id, ASSIGNED_TO, REQUEST_DATE AS RECORD_DATE, DUE_DATE AS DATE_DUE, 'DCR' AS RECORD_TYPE, dcrt.REQUEST_TEXT AS TODO_TEXT
            FROM DOCM_CHNG_RQST dcr left join DOC_CHG_REQ_TXT dcrt on dcr.REQUEST_ID = dcrt.REQUEST_ID
            WHERE (CLOSED <> 'Y' OR CLOSED IS NULL) AND (DUE_DATE <= CURDATE() OR DUE_DATE IS NULL)
            
            UNION ALL
            
            SELECT 'NONCONFORMANCE' AS source_table, NCM_ID AS record_id, ASSIGNED_TO, NCM_DATE, DUE_DATE AS DATE_DUE, 'NCM' AS RECORD_TYPE, PRODUCT_ID AS TODO_TEXT
            FROM NONCONFORMANCE 
            WHERE (CLOSED <> 'Y' OR CLOSED IS NULL) AND (DUE_DATE <= CURDATE() OR DUE_DATE IS NULL)
            
            UNION ALL
            
            SELECT 'NONCONFORMANCE_DISP' AS source_table, NCM_ID AS record_id, DISP_ASSIGNED_TO AS ASSIGNED_TO, NCM_DATE AS RECORD_DATE, DISP_DUE_DATE AS DATE_DUE, 'Disposition' AS RECORD_TYPE, PRODUCT_ID AS TODO_TEXT
            FROM NONCONFORMANCE 
            WHERE (DISP_ASSIGNED_TO IS NOT NULL AND DISP_ASSIGNED_TO <> '') 
            AND (DISP_CLOSED <> 'Y' OR DISP_CLOSED IS NULL) AND (DISP_DUE_DATE <= CURDATE() OR DISP_DUE_DATE IS NULL)
            
            UNION ALL
            
            SELECT 'NONCONFORMANCE_VERIFY' AS source_table, NCM_ID AS record_id, VERIFIED_ASSG_TO AS ASSIGNED_TO, NCM_DATE AS RECORD_DATE, VERIFY_DUE_DATE AS DATE_DUE, 'Verification' AS RECORD_TYPE, PRODUCT_ID AS TODO_TEXT
            FROM NONCONFORMANCE 
            WHERE (VERIFIED_ASSG_TO IS NOT NULL AND VERIFIED_ASSG_TO <> '') 
            AND (VERIFY_CLOSED <> 'Y' OR VERIFY_CLOSED IS NULL) AND (VERIFY_DUE_DATE <= CURDATE() OR VERIFY_DUE_DATE IS NULL);`
        
        
        connection.query(query, (err, rows, fields) => {
            if (err) {
                console.log('Failed to query for inputs: ' + err);
                res.sendStatus(500);
                return;
            }
            res.json(rows);
        });

        connection.end();
        });
    
    } catch (err) {
        console.log('Error connecting to Db');
        return;
    }

});

module.exports = router;