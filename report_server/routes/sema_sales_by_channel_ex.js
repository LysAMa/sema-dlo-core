const express = require('express');
const router = express.Router();
require('datejs');
const semaLog = require('../seama_services/sema_logger');
const { getMostRecentReceipt, getSalesChannels} = require('../seama_services/sql_services');



const sqlSalesByChannel = 'SELECT * \
		FROM receipt \
		WHERE receipt.kiosk_id = ? AND receipt.sales_channel_id = ? \
		AND receipt.created_at BETWEEN ? AND ? \
		ORDER BY receipt.created_at';


router.get('/', async( request, response ) => {
	semaLog.info( 'sales_by_channel_ex Entry - kiosk: - ', request.query["site-id"]);
	let results = initResults();

	request.check("site-id", "Parameter site-id is missing").exists();

	const result = await request.getValidationResult();
	if (!result.isEmpty()) {
		const errors = result.array().map((elem) => {
			return elem.msg;
		});
		semaLog.error("sales_by_channel_ex VALIDATION ERROR: ", errors );
		response.status(400).send(errors.toString());
	} else {

		let endDate =null;
		let beginDate = null;
		if( request.query.hasOwnProperty("end-date") || request.query.hasOwnProperty("begin-date")) {
			// If either begin/end date are specified, both must be specified
			if( ! request.query.hasOwnProperty("end-date") || ! request.query.hasOwnProperty("begin-date")) {
				const msg = "sales_by_channel_ex - Both begin-date AND end-date are required"
				semaLog.error(msg );
				response.status(400).send(msg);
				return;
			}else{
				endDate = new Date(Date.parse(request.query["end-date"]));
				beginDate = new Date(Date.parse(request.query["begin-date"]));
			}
		}
		__pool.getConnection(async (err, connection) => {
			try {
				if (endDate == null) {
					endDate = await getMostRecentReceipt(connection, request.query);
					beginDate = new Date(endDate.getFullYear(), 0);	// 	Default to start of the year
				}
				results.salesByChannel.beginDate = beginDate;
				results.salesByChannel.endDate = endDate;
				const salesChannels = await getSalesChannels(connection);
				for( let index = 0; index < salesChannels.length; index++  ){
					await getSalesByChannel( connection, salesChannels[index], request.query["site-id"], beginDate, endDate, results );
				}
				semaLog.info("sales-by-channel exit");
				response.json(results);
				connection.release();
			} catch (err) {
				connection.release();
				__te(err, response, 500, results);
			}
		});

	}
});


const getSalesByChannel = ( connection, salesChannel, kioskId, beginDate, endDate, results) =>{
	return new Promise((resolve, reject ) => {
		connection.query(sqlSalesByChannel, [kioskId, salesChannel.id, beginDate, endDate], (err, sqlResult) => {
			if (!err) {
				if (Array.isArray(sqlResult) && sqlResult.length > 0) {
					let salesData = sqlResult.map(row => {
						return { x: row.created_at, y: parseFloat( row.total) }
					});

					results.salesByChannel.datasets.push({ salesChannel: salesChannel.name, type:"total", data: salesData });
					salesData = sqlResult.map(row => {
						return { x: row.created_at, y: parseFloat( row.cogs) }
					});

					results.salesByChannel.datasets.push({ salesChannel: salesChannel.name, type:"cogs", data: salesData });
					semaLog.info("getSalesByChannel - processed salesChannel ", salesChannel.name );
					resolve();
				}
			}else{
				semaLog.error( "getSalesByChannel - error: " + err.message);
				reject( err );
			}
		});
	});
};


const initResults = () =>{
	return {
		// salesByChannel: { labels: [], datasets: []}
		salesByChannel: { beginDate:"N/A", endDate: "N/A", datasets: []}

	}
};



module.exports = router;
