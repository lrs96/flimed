<?php include('includes/header-medico.php'); ?>

<section class="box__panel">
	<div class="container">
		<div class="financeiro__box">
			<div class="financeiro__title">
				<h3>Fornecedores</h3>
				<p>Gerencie seus fornecedores</p>					
					
			<div class="cadastro-box">

						<div style="position: relative;" class="form-cadastro centro-medico active">
							<a style="float: right;" href="#fornecedores" class="btn btn-gradient" data-fancybox="fornecedores">ADICIONAR</a>
						<table style="    border-bottom: dashed 1px; border-bottom-color: #e6e6e6" class="table table-dashed">
				<tbody>
			    <thead>
					<tr>
						<th scope="col">Nome</th>
						<th scope="col">Telefone</th>
						<th scope="col">Descrição</th>
						<th scope="col">Plano de Contas</th>
						<th scope="col">Ação</th>
					</tr>
				</thead>
					<tr>
						<td>10/05/2019</td>
						<td>Documento</td>
						<td>Documento</td>
						<td>Documento</td>
						<td><a href="" class="btn-gradient">Ver mais</a></td>
						<td><a href="" class="btndelete">Excluir</a></td>
					</tr>
				</tbody>
			</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>


	<div class="modal edit-pacient" id="fornecedores">
		<div class="modal-container">
			<ul class="nav nav-pills" id="tablist" role="tablist">
				<li class="nav-item">
					<a class="nav-link active" data-toggle="pill" href="#geral" role="tab">Geral</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" data-toggle="pill" href="#endereco" role="tab">Endereço</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" data-toggle="pill" href="#retencao" role="tab">Retenções</a>
				</li>
			</ul>
			
			<div class="tab-content" id="pills-tabContent">
				<div class="tab-pane fade show active" id="geral" role="tabpanel">
	<div class="col-md-12">					
					<form action="" class="form">
						<div class="row">
							<div class="col-md-3">
								<input type="text" name="" placeholder="Razão Social/Nome Completo">
							</div>
							<div class="col-md-3">
								<input type="text" name="" placeholder="Descrição">
							</div>
							<div class="col-md-3">
								<input type="text" name="" placeholder="CPF/CNPJ">
							</div>
							<div class="col-md-3">
								<input type="text" name="" placeholder="Nome do contato">
							</div>
							<div class="col-md-3">
								<input type="text" name="" placeholder="Observação">
							</div>
						    <div class="col-md-3">
								<input type="text" name="" placeholder="Telefone">
							</div>
							<div class="col-md-3">
								<input type="email" name="" placeholder="E-mail">
							</div>
							<div class="col-md-3">
								<div class="select">
								<select name="" id="">
									<option value="">Selecione uma categoria</option>
									<option value="">OUTROS ADIANTAMENTOS</option>
									<option value="">OUTROS CREDITOS - CIRCULANTE</option>
									<option value="">EMPRESTIMOS OU FINANCIAMENTOS - CIRCULANTE</option>
									<option value="">OUTRAS OBRIGAÇÕES - CIRCULANTE</option>
									<option value="">DESPESA COM PESSOAL</option>
								</select>
							</div>
							</div>
							
							<div class="col-md-3">
								<input type="text" name="" placeholder="Plano de contas">
							</div>
							</div>
							<div class="row">
								<div class="col-md-3">
									<input type="submit" class="btn btn-gradient" value="Salvar Alterações">
								</div>
								<div class="col-md-3">
									<input type="submit" class="btn btndelete" value="Cancelar">
								</div>
						</div>
					</form>
			</div>
				</div>

				<div class="tab-pane fade" id="endereco" role="tabpanel">
					
	<div class="col-md-12">					
					<form action="" class="form">
						<div class="row">
							<div class="col-md-3">
								<input type="text" name="" placeholder="CEP">
							</div>
							<div class="col-md-3">
								<input type="text" name="" placeholder="Endereço">
							</div>
						    <div class="col-md-3">
								<input type="tel" name="" placeholder="Número">
							</div>
							<div class="col-md-3">
								<input type="text" name="" placeholder="Complemento">
							</div>
							<div class="col-md-3">
								<input type="text" name="" placeholder="Bairro">
							</div>
							<div class="col-md-3">
								<input type="text" name="" placeholder="Cidade">
							</div>
							<div class="col-md-3">
								<div class="select">
									<select name="" id="">
										<option value="" >Estado</option>
										<option value="">AC</option>
										<option value="">AL</option>
										<option value="">AP</option>
										<option value="">AM</option>
										<option value="">BA</option>
									    <option value="">CE</option>
									    <option value="">DF</option>
										<option value="">ES</option>
										<option value="">GO</option>
										<option value="">MA</option>
										<option value="">MT</option>
										<option value="">MS</option>
										<option value="">MG</option>
										<option value="">PA</option>
										<option value="">PB</option>
										<option value="">PR</option>
										<option value="">PE</option>
										<option value="">PI</option>
										<option value="">RJ</option>
										<option value="">RN</option>
										<option value="">RS</option>
										<option value="">RO</option>
										<option value="">RR</option>
										<option value="">SC</option>
										<option value="">SP</option>
										<option value="">SE</option>
									</select>
								</div>
							</div>	
							</div>
							<div class="row">
								<div class="col-md-3">
									<input type="submit" class="btn btn-gradient" value="Salvar Alterações">
								</div>
								<div class="col-md-3">
									<input type="submit" class="btn btndelete" value="Cancelar">
								</div>
						</div>
					</form>
			</div>
				</div>
		<div class="tab-pane fade" id="retencao" role="tabpanel">
							<div class="col-md-12">					
					<form action="" class="form">
						<div class="row">
							<div class="col-md-3">
								<input type="text" name="" placeholder="PIS">
							</div>
							<div class="col-md-3">
								<input type="text" name="" placeholder="COFINS">
							</div>
						    <div class="col-md-3">
								<input type="text" name="" placeholder="CSLL">
							</div>
							<div class="col-md-3">
								<input type="text" name="" placeholder="IR">
							</div>
							<div class="col-md-3">
								<input type="text" name="" placeholder="ISS">
							</div>
							<div class="col-md-3">
								<input type="text" name="" placeholder="INSS">
							</div>								
							</div>
							<div class="row">
								<div class="col-md-3">
									<input type="submit" class="btn btn-gradient" value="Salvar Alterações">
								</div>
								<div class="col-md-3">
									<input type="submit" class="btn btndelete" value="Cancelar">
								</div>
						</div>
					</form>
			</div>

				</div>

			</div>
		</div>
	</div>

				</div>

<?php include('includes/footer.php'); ?>

<script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.0/js/bootstrap.min.js"></script>
<script>
		$('#tablist a').on('click', function(e) {
			e.preventDefault()
			$('#tablist a').removeClass('active');
			$(this).addClass('active');
		})
	</script>

</body>
</html>
